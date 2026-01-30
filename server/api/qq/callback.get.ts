import {getAccessToken, getOpenId, getUserInfo} from '../../utils/qq'
import {generateCode, saveAuthCode} from '../../utils/store'
import type {StandardUserInfo} from '../../types/qq'
import {Buffer} from "node:buffer";

interface OAuthState {
    clientId: string
    redirectUri: string
    scope: string
    state: string
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    const code = query.code as string
    const state = query.state as string

    // 验证必要参数
    if (!code) {
        throw createError({
            statusCode: 400,
            message: '缺少授权码 code',
        })
    }

    try {
        // 1. 获取 access_token
        const tokenResponse = await getAccessToken(
            config.qq.appId,
            config.qq.appKey,
            code,
            config.qq.redirectUri
        )

        // 2. 获取 openid（优先使用 token 响应中的）
        let openId = tokenResponse.openid
        if (!openId) {
            const openIdResponse = await getOpenId(tokenResponse.access_token)
            openId = openIdResponse.openid
        }

        // 3. 获取用户信息
        const userInfo = await getUserInfo(
            tokenResponse.access_token,
            config.qq.appId,
            openId
        )

        // 4. 返回标准化用户信息
        const result: StandardUserInfo = {
            id: openId,
            name: userInfo.nickname,
            avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1,
            rawData: userInfo,
        }

        // 5. 解析 OAuth state
        let oauthState: OAuthState | null = null
        try {
            if (state) {
                oauthState = JSON.parse(Buffer.from(state, 'base64url').toString())
            }
        } catch {
            // state 解析失败，直接返回用户信息
        }

        // 6. 如果是 OAuth 流程，生成授权码并重定向
        if (oauthState?.redirectUri) {
            const authCodeData = {
                userId: openId,
                userInfo: result,
                clientId: oauthState.clientId,
                redirectUri: oauthState.redirectUri,
                scope: oauthState.scope,
            }

            const authCode = await generateCode(authCodeData, config.oauth.jwtSecret)
            console.log('[QQ Callback] 生成授权码:', authCode.substring(0, 20) + '...', '用户:', openId)

            saveAuthCode(authCode, authCodeData)
            console.log('[QQ Callback] 授权码已保存，重定向到:', oauthState.redirectUri)

            const redirectUrl = new URL(oauthState.redirectUri)
            redirectUrl.searchParams.set('code', authCode)
            redirectUrl.searchParams.set('state', oauthState.state)

            return sendRedirect(event, redirectUrl.toString())
        }

        // 7. 非 OAuth 流程，直接返回用户信息
        return {
            success: true,
            state,
            user: result,
            token: {
                access_token: tokenResponse.access_token,
                expires_in: tokenResponse.expires_in,
                refresh_token: tokenResponse.refresh_token,
            },
        }
    } catch (error) {
        throw createError({
            statusCode: 500,
            message: error instanceof Error ? error.message : 'QQ 登录失败',
        })
    }
})
