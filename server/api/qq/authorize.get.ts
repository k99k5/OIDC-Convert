import {buildAuthorizeUrl} from '../../utils/qq'

export default defineEventHandler((event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    // 从请求中获取 state，或生成随机 state
    const state = (query.state as string) || crypto.randomUUID()

    // 构建授权 URL
    const authorizeUrl = buildAuthorizeUrl(
        config.qq.appId,
        config.qq.redirectUri,
        state
    )

    // 重定向到 QQ 授权页面
    return sendRedirect(event, authorizeUrl)
})
