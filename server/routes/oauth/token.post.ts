import {generateToken, getAuthCode, saveAccessToken, TOKEN_EXPIRES_IN} from '../../utils/store'
import {createIdToken} from '../../utils/jwt'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const body = await readBody(event)

    const grantType = body.grant_type
    const code = body.code
    const redirectUri = body.redirect_uri
    const clientId = body.client_id
    const clientSecret = body.client_secret

    // 验证 grant_type
    if (grantType !== 'authorization_code') {
        throw createError({
            statusCode: 400,
            message: 'unsupported_grant_type',
        })
    }

    // 验证 client 凭证
    if (clientId !== config.oauth.clientId || clientSecret !== config.oauth.clientSecret) {
        throw createError({
            statusCode: 401,
            message: 'invalid_client',
        })
    }

    // 获取并验证授权码
    const authData = getAuthCode(code)
    if (!authData) {
        throw createError({
            statusCode: 400,
            message: 'invalid_grant',
        })
    }

    // 验证 redirect_uri
    if (authData.redirectUri !== redirectUri) {
        throw createError({
            statusCode: 400,
            message: 'invalid_grant: redirect_uri mismatch',
        })
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
