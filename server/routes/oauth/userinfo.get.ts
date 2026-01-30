import {getStoredToken} from '../../utils/store'

export default defineEventHandler((event) => {
    const authHeader = getHeader(event, 'authorization')

    console.log('[UserInfo] 收到请求，Authorization header:', authHeader ? '存在' : '缺失')

    if (!authHeader?.startsWith('Bearer ')) {
        console.error('[UserInfo] Authorization header 格式错误')
        throw createError({
            statusCode: 401,
            message: 'invalid_token',
        })
    }

    const token = authHeader.slice(7)
    console.log('[UserInfo] Token:', token.substring(0, 8) + '...')

    const tokenData = getStoredToken(token)

    if (!tokenData) {
        console.error('[UserInfo] Token 无效或已过期')
        throw createError({
            statusCode: 401,
            message: 'invalid_token',
        })
    }

    console.log('[UserInfo] Token 验证成功，返回用户信息:', tokenData.userInfo.id)

    return {
        sub: tokenData.userInfo.id,
        name: tokenData.userInfo.name,
        picture: tokenData.userInfo.avatar,
    }
})
