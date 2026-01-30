// RSA 密钥对（启动时生成）
let privateKey: CryptoKey | null = null
let publicKey: CryptoKey | null = null
let keyId: string = ''

export async function initKeys(): Promise<void> {
    if (privateKey && publicKey) return

    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
    )

    privateKey = keyPair.privateKey
    publicKey = keyPair.publicKey
    keyId = crypto.randomUUID().slice(0, 8)
}

export function getKeyId(): string {
    return keyId
}

export function getPrivateKey(): CryptoKey {
    if (!privateKey) throw new Error('密钥未初始化')
    return privateKey
}

export function getPublicKey(): CryptoKey {
    if (!publicKey) throw new Error('密钥未初始化')
    return publicKey
}

export async function getJwks(): Promise<object> {
    await initKeys()
    const jwk = await crypto.subtle.exportKey('jwk', getPublicKey())
    return {
        keys: [
            {
                ...jwk,
                kid: keyId,
                use: 'sig',
                alg: 'RS256',
            },
        ],
    }
}
