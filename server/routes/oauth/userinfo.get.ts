import {getStoredToken} from '../../utils/store'

export default defineEventHandler((event) => {
    const authHeader = getHeader(event, 'authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({
            statusCode: 401,
            message: 'invalid_token',
        })
    }

    const token = authHeader.slice(7)
    const tokenData = getStoredToken(token)

    if (!tokenData) {
        throw createError({
            statusCode: 401,
            message: 'invalid_token',
        })
    }

    return {
        sub: tokenData.userInfo.id,
        name: tokenData.userInfo.name,
        picture: tokenData.userInfo.avatar,
    }
})
