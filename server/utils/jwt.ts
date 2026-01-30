import type {StandardUserInfo} from '../types/qq'
import {getKeyId, getPrivateKey, initKeys} from './keys'

interface JwtHeader {
    alg: string
    typ: string
    kid?: string
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
    // 先转换为 UTF-8 字节，再进行 base64 编码
    const utf8Bytes = new TextEncoder().encode(str)
    const binaryString = String.fromCharCode(...utf8Bytes)
    return btoa(binaryString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
    // 补齐 padding
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) {
        str += '='
    }
    // 先 base64 解码，再从 UTF-8 字节转换为字符串
    const binaryString = atob(str)
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return base64UrlEncode(String.fromCharCode(...new Uint8Array(buffer)))
}

async function rsaSign(data: string, privateKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        encoder.encode(data)
    )
    return arrayBufferToBase64Url(signature)
}

/**
 * 使用 HMAC-SHA256 创建简单的 JWT（用于授权码和 access token）
 */
export async function createSimpleJwt(
    payload: Record<string, any>,
    secret: string,
    expiresIn: number
): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn,
    }

    const header = { alg: 'HS256', typ: 'JWT' }
    const headerB64 = base64UrlEncode(JSON.stringify(header))
    const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload))

    // 使用 HMAC-SHA256 签名
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(`${headerB64}.${payloadB64}`)
    )

    const signatureB64 = arrayBufferToBase64Url(signature)
    return `${headerB64}.${payloadB64}.${signatureB64}`
}

/**
 * 验证并解析简单的 JWT
 */
export async function verifySimpleJwt<T = any>(
    token: string,
    secret: string
): Promise<T | null> {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }

        const [headerB64, payloadB64, signatureB64] = parts

        // 验证签名
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        )

        const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            encoder.encode(`${headerB64}.${payloadB64}`)
        )

        if (!valid) {
            return null
        }

        // 解析 payload
        const payload = JSON.parse(base64UrlDecode(payloadB64))

        // 检查过期时间
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null
        }

        return payload as T
    } catch {
        return null
    }
}

export async function createIdToken(
    userInfo: StandardUserInfo,
    issuer: string,
    audience: string,
    expiresIn = 3600
): Promise<string> {
    await initKeys()
    const now = Math.floor(Date.now() / 1000)

    const header: JwtHeader = {
        alg: 'RS256',
        typ: 'JWT',
        kid: getKeyId(),
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
    const signature = await rsaSign(`${headerB64}.${payloadB64}`, getPrivateKey())

    return `${headerB64}.${payloadB64}.${signature}`
}
