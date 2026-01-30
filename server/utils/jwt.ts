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
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
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
