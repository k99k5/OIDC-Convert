import type {QQOpenIdResponse, QQTokenResponse, QQUserInfoResponse,} from '../types/qq'

// QQ OAuth 端点
const QQ_AUTHORIZE_URL = 'https://graph.qq.com/oauth2.0/authorize'
const QQ_TOKEN_URL = 'https://graph.qq.com/oauth2.0/token'
const QQ_OPENID_URL = 'https://graph.qq.com/oauth2.0/me'
const QQ_USER_INFO_URL = 'https://graph.qq.com/user/get_user_info'

/**
 * 生成 QQ 授权 URL
 */
export function buildAuthorizeUrl(
    appId: string,
    redirectUri: string,
    state: string,
    scope = 'get_user_info'
): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: appId,
        redirect_uri: redirectUri,
        state,
        scope,
    })
    return `${QQ_AUTHORIZE_URL}?${params.toString()}`
}

/**
 * 通过 authorization_code 获取 access_token
 */
export async function getAccessToken(
    appId: string,
    appKey: string,
    code: string,
    redirectUri: string
): Promise<QQTokenResponse> {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: appKey,
        code,
        redirect_uri: redirectUri,
        fmt: 'json',
        need_openid: '1',
    })

    const response = await fetch(`${QQ_TOKEN_URL}?${params.toString()}`)
    const data = await response.json()

    if (data.error) {
        throw new Error(`获取 access_token 失败: ${data.error_description || data.error}`)
    }

    return data as QQTokenResponse
}

/**
 * 获取用户 OpenID（如果 token 响应中没有）
 */
export async function getOpenId(accessToken: string): Promise<QQOpenIdResponse> {
    const params = new URLSearchParams({
        access_token: accessToken,
        fmt: 'json',
    })

    const response = await fetch(`${QQ_OPENID_URL}?${params.toString()}`)
    const data = await response.json()

    if (data.error) {
        throw new Error(`获取 OpenID 失败: ${data.error_description || data.error}`)
    }

    return data as QQOpenIdResponse
}

/**
 * 获取用户信息
 */
export async function getUserInfo(
    accessToken: string,
    appId: string,
    openId: string
): Promise<QQUserInfoResponse> {
    const params = new URLSearchParams({
        access_token: accessToken,
        oauth_consumer_key: appId,
        openid: openId,
        format: 'json',
    })

    const response = await fetch(`${QQ_USER_INFO_URL}?${params.toString()}`)
    const data = await response.json() as QQUserInfoResponse

    if (data.ret !== 0) {
        throw new Error(`获取用户信息失败: ${data.msg}`)
    }

    return data
}
