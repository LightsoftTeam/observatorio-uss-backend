export function getResetPasswordTemplate(token: string){
    const url = `${process.env.OBSERVATORY_APP_URL}/reset-password?token=${token}`;
    const template = `
        <h1>Reset Password</h1>
        <p>Click <a href="${url}">here</a> to reset your password</p>
    `;
    return template;
}