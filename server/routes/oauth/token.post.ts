import {generateToken, getAuthCode, saveAccessToken, TOKEN_EXPIRES_IN} from '../../utils/store'
import {createIdToken} from '../../utils/jwt'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // 支持 application/x-www-form-urlencoded 和 application/json
    const contentType = getHeader(event, 'content-type') || ''
    let body: Record<string, string>

    if (contentType.includes('application/x-www-form-urlencoded')) {
        const rawBody = await readBody(event)
        body = typeof rawBody === 'string'
            ? Object.fromEntries(new URLSearchParams(rawBody))
            : rawBody
    } else {
        body = await readBody(event)
    }

    console.log('[Token] 收到请求:', {
        contentType,
        grantType: body.grant_type,
        code: body.code?.substring(0, 8) + '...',
        clientId: body.client_id,
        redirectUri: body.redirect_uri,
    })

    const grantType = body.grant_type
    const code = body.code
    const redirectUri = body.redirect_uri
    const clientId = body.client_id
    const clientSecret = body.client_secret

    // 验证 grant_type
    if (grantType !== 'authorization_code') {
        setResponseStatus(event, 400)
        return {
            error: 'unsupported_grant_type',
            error_description: 'Only authorization_code is supported',
        }
    }

    // 验证 client 凭证
    if (clientId !== config.oauth.clientId || clientSecret !== config.oauth.clientSecret) {
        setResponseStatus(event, 401)
        return {
            error: 'invalid_client',
            error_description: 'Client authentication failed',
        }
    }

    // 获取并验证授权码
    const authData = getAuthCode(code as string)
    if (!authData) {
        console.error('[Token] 授权码无效或已过期:', code?.substring(0, 8) + '...')
        setResponseStatus(event, 400)
        return {
            error: 'invalid_grant',
            error_description: 'Authorization code is invalid or expired',
        }
    }

    console.log('[Token] 授权码验证成功，用户:', authData.userId)

    // 验证 redirect_uri
    if (authData.redirectUri !== redirectUri) {
        setResponseStatus(event, 400)
        return {
            error: 'invalid_grant',
            error_description: 'redirect_uri mismatch',
        }
    }

    // 生成 access_token
    const accessToken = generateToken()
    saveAccessToken(accessToken, {
        userId: authData.userId,
        userInfo: authData.userInfo,
        scope: authData.scope,
    })

    // 生成 id_token
    const idToken = await createIdToken(
        authData.userInfo,
        config.public.baseUrl,
        clientId
    )

    return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(TOKEN_EXPIRES_IN / 1000),
        id_token: idToken,
    }
})
