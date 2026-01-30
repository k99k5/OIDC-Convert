// QQ OAuth 相关类型定义

// QQ 授权响应
export interface QQAuthResponse {
    code: string
    state: string
}

// QQ Access Token 响应
export interface QQTokenResponse {
    access_token: string
    expires_in: number
    refresh_token: string
    openid?: string // 当 need_openid=1 时返回
}

// QQ OpenID 响应
export interface QQOpenIdResponse {
    client_id: string
    openid: string
}

// QQ 用户信息响应
export interface QQUserInfoResponse {
    ret: number
    msg: string
    nickname: string
    figureurl: string
    figureurl_1: string
    figureurl_2: string
    figureurl_qq_1: string
    figureurl_qq_2: string
    gender: string
    gender_type: number
    province: string
    city: string
    year: string
    constellation: string
}

// 标准化的用户信息（用于返回给 Logto）
export interface StandardUserInfo {
    id: string // openid
    name: string
    avatar: string
    email?: string
    rawData: QQUserInfoResponse
}

// QQ OAuth 错误
export interface QQOAuthError {
    error: string
    error_description: string
}
