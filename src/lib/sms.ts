export async function sendSMS(phone: string, code: string): Promise<boolean> {
  const accessKeyId = process.env.SMS_ACCESS_KEY_ID;

  if (!accessKeyId) {
    // 开发模式：控制台输出验证码
    console.log(`[DEV SMS] ${phone} 验证码: ${code}`);
    return true;
  }

  // 生产环境接入阿里云 SMS
  // TODO: 接入阿里云 SMS SDK
  return true;
}
