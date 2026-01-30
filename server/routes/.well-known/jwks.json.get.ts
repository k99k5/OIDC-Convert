export default defineEventHandler(() => {
    // 使用 HS256 对称加密，不需要公钥
    // 返回空的 keys 数组
    return {
        keys: [],
    }
})
