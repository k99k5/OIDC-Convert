import type {StandardUserInfo} from '../types/qq'

interface JwtHeader {
    alg: string
    typ: string
}

interface IdTokenPayload {
    iss: string
    sub: string
    aud: string
    exp: number
    iat: number
    name?: string
    picture?: string
}

function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

async function hmacSign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
}

export async function createIdToken(
    userInfo: StandardUserInfo,
    issuer: string,
    audience: string,
    secret: string,
    expiresIn = 3600
): Promise<string> {
    const now = Math.floor(Date.now() / 1000)

    const header: JwtHeader = {
        alg: 'HS256',
        typ: 'JWT',
    }

    const payload: IdTokenPayload = {
        iss: issuer,
        sub: userInfo.id,
        aud: audience,
        exp: now + expiresIn,
        iat: now,
        name: userInfo.name,
        picture: userInfo.avatar,
    }

    const headerB64 = base64UrlEncode(JSON.stringify(header))
    const payloadB64 = base64UrlEncode(JSON.stringify(payload))
    const signature = await hmacSign(`${headerB64}.${payloadB64}`, secret)

    return `${headerB64}.${payloadB64}.${signature}`
}
