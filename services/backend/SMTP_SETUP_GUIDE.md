# 📧 SMTP Setup Guide for Safe Wave

## 🎯 **Quick Start Options**

### **Option 1: Gmail SMTP (Recommended for Development)**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

### **Option 2: Development SMTP Server (Local Testing)**
```env
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@safewave.local
```

## 🚀 **Step-by-Step Setup**

### **Gmail SMTP Setup**

#### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click "Security" → "2-Step Verification"
3. Enable 2-Factor Authentication

#### **Step 2: Generate App Password**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "2-Step Verification" → "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Name it "Safe Wave Backend"
5. Copy the 16-character password

#### **Step 3: Update Environment File**
```bash
# Edit your .env file
nano .env

# Add these lines:
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

### **Development SMTP Server Setup**

#### **Step 1: Start Development SMTP Server**
```bash
# In a new terminal window
python dev_smtp_server.py
```

#### **Step 2: Update Environment File**
```bash
# Edit your .env file
nano .env

# Add these lines:
SMTP_SERVER=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@safewave.local
```

## 🧪 **Testing Your SMTP Setup**

### **Test 1: Connection Test**
```bash
python test_email.py
```

### **Test 2: Manual SMTP Test**
```bash
python -c "
import smtplib
from email.mime.text import MIMEText

# Test Gmail
try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login('your-email@gmail.com', 'your-app-password')
    print('✅ Gmail SMTP working!')
    server.quit()
except Exception as e:
    print(f'❌ Gmail SMTP failed: {e}')

# Test Local
try:
    server = smtplib.SMTP('localhost', 1025)
    print('✅ Local SMTP working!')
    server.quit()
except Exception as e:
    print(f'❌ Local SMTP failed: {e}')
"
```

## 🔧 **Alternative SMTP Providers**

### **Outlook/Hotmail**
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
```

### **Yahoo Mail**
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USERNAME=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@yahoo.com
```

### **ProtonMail**
```env
SMTP_SERVER=127.0.0.1
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=your-email@protonmail.com
```

## 🚨 **Critical Alert Email Templates**

### **High Risk Alert**
```
Subject: 🚨 Mental Health Alert - [User Name]

Dear Care Person,

This is an automated alert from Safe Wave regarding [User Name].

RISK LEVEL: HIGH
REQUIRES: Immediate attention and monitoring

[Alert Message]

Please check in with them as soon as possible.

Best regards,
Safe Wave Team
```

### **Critical Risk Alert**
```
Subject: 🚨 CRITICAL ALERT - [User Name] needs immediate attention

URGENT: Mental Health Crisis Alert

User: [User Name]
Risk Level: CRITICAL

[Alert Message]

This requires IMMEDIATE attention. Please contact [User Name] right away.

If this is a life-threatening emergency, call emergency services immediately.

Best regards,
Safe Wave Crisis Alert System
```

## 📋 **Troubleshooting**

### **Common Issues & Solutions**

#### **Issue 1: "Authentication failed"**
- ✅ Enable 2-Factor Authentication
- ✅ Generate App Password (not regular password)
- ✅ Check username/email format

#### **Issue 2: "Connection refused"**
- ✅ Check if SMTP server is running
- ✅ Verify port number
- ✅ Check firewall settings

#### **Issue 3: "SSL/TLS required"**
- ✅ Use port 587 with STARTTLS
- ✅ Use port 465 with SSL
- ✅ Enable TLS in your code

#### **Issue 4: "Rate limit exceeded"**
- ✅ Gmail: 500 emails/day limit
- ✅ Outlook: 300 emails/day limit
- ✅ Consider using multiple providers

### **Debug Commands**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check if port is open
nc -zv localhost 1025

# View SMTP logs
tail -f /var/log/mail.log
```

## 🔒 **Security Best Practices**

### **Environment Variables**
- ✅ Never commit SMTP credentials to git
- ✅ Use strong, unique passwords
- ✅ Rotate credentials regularly

### **Email Security**
- ✅ Use TLS/SSL encryption
- ✅ Implement rate limiting
- ✅ Validate email addresses
- ✅ Monitor for abuse

### **Production Considerations**
- ✅ Use dedicated SMTP service (SendGrid, Mailgun)
- ✅ Implement email queuing
- ✅ Add retry logic
- ✅ Monitor delivery rates

## 📊 **Monitoring & Testing**

### **Email Delivery Test**
```bash
# Send test email
python -c "
from app.utils.email_service import EmailService
email_service = EmailService()
success = email_service.send_email(
    'test@example.com',
    'Safe Wave Test',
    'This is a test email from Safe Wave Backend'
)
print(f'Email sent: {success}')
"
```

### **Health Check Endpoint**
```bash
curl http://localhost:9000/audio/health
```

## 🎉 **Success Indicators**

When SMTP is working correctly, you should see:
- ✅ No authentication errors
- ✅ Emails delivered to recipients
- ✅ Critical alerts sent automatically
- ✅ Email logs in your SMTP server
- ✅ Successful health checks

## 🚀 **Next Steps**

1. **Choose your SMTP provider**
2. **Update your .env file**
3. **Test the connection**
4. **Start your backend server**
5. **Test critical alert emails**

Your Safe Wave backend will now be able to send critical mental health alerts to care persons automatically! 🌊📧
