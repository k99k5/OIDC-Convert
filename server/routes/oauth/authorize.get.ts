import {buildAuthorizeUrl} from '../../utils/qq'

export default defineEventHandler((event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    // OAuth 2.0 标准参数
    const clientId = query.client_id as string
    const redirectUri = query.redirect_uri as string
    const responseType = query.response_type as string
    const scope = (query.scope as string) || 'openid profile'
    const state = query.state as string

    // 验证必要参数
    if (!clientId || !redirectUri || !state) {
        throw createError({
            statusCode: 400,
            message: '缺少必要参数: client_id, redirect_uri, state',
        })
    }

    if (responseType !== 'code') {
        throw createError({
            statusCode: 400,
            message: '仅支持 response_type=code',
        })
    }

    // 将 OAuth 参数编码到 QQ 的 state 中
    const qqState = Buffer.from(JSON.stringify({
        clientId,
        redirectUri,
        scope,
        state,
    })).toString('base64url')

    // 重定向到 QQ 授权
    const authorizeUrl = buildAuthorizeUrl(
        config.qq.appId,
        config.qq.redirectUri,
        qqState
    )

    return sendRedirect(event, authorizeUrl)
})
