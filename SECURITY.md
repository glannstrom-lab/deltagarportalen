# Security Policy

## Reporting a Vulnerability

We take the security of Jobin seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Send an email to **security@jobin.se** with the following information:

1. **Description** - A clear description of the vulnerability
2. **Steps to Reproduce** - Detailed steps to reproduce the issue
3. **Impact** - Your assessment of the potential impact
4. **Affected Components** - Which parts of the system are affected
5. **Suggested Fix** - If you have one (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: Within 5 business days, we will provide an initial assessment
- **Resolution Timeline**: We aim to resolve critical issues within 30 days
- **Updates**: We will keep you informed about the progress

### Safe Harbor

We consider security research conducted in accordance with this policy to be:

- Authorized concerning any applicable anti-hacking laws
- Authorized concerning any relevant anti-circumvention laws
- Exempt from restrictions in our Terms of Service that would interfere with security research

We will not pursue legal action against researchers who:
- Make a good faith effort to avoid privacy violations and data destruction
- Avoid exploiting the vulnerability beyond what is necessary to demonstrate it
- Do not publicly disclose the vulnerability before we have addressed it

## Scope

### In Scope

- jobin.se and all subdomains
- Jobin mobile applications
- Jobin API endpoints
- Authentication and authorization systems
- Data storage and handling
- Third-party integrations within our control

### Out of Scope

- Social engineering attacks on Jobin employees
- Physical attacks against Jobin infrastructure
- Denial of service attacks
- Spam or social engineering
- Third-party services not controlled by Jobin
- Issues already reported by others (we will let you know)

## Qualifying Vulnerabilities

Examples of vulnerabilities we are particularly interested in:

- **Authentication Bypass** - Gaining unauthorized access to accounts
- **SQL Injection** - Database manipulation through user input
- **XSS (Cross-Site Scripting)** - Executing scripts in other users' browsers
- **CSRF (Cross-Site Request Forgery)** - Unauthorized actions on behalf of users
- **IDOR (Insecure Direct Object Reference)** - Accessing other users' data
- **Data Exposure** - Unintended exposure of sensitive information
- **Privilege Escalation** - Gaining higher access levels than authorized
- **API Security Issues** - Authentication, authorization, or data exposure in APIs

## Security Measures

### Current Security Practices

We implement the following security measures:

**Infrastructure**
- All data encrypted in transit (TLS 1.3)
- Database encryption at rest
- Regular security audits
- Automated vulnerability scanning

**Application**
- Row Level Security (RLS) for data isolation
- bcrypt password hashing
- JWT tokens with appropriate expiration
- Input validation and sanitization
- Content Security Policy (CSP) headers

**Operations**
- Regular dependency updates
- Security-focused code reviews
- Access logging and monitoring
- Incident response procedures

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

We only provide security updates for the latest version. Please ensure you are using the most recent version.

## Contact

- **Security Issues**: security@jobin.se
- **General Privacy**: privacy@jobin.se
- **Data Protection Officer**: dpo@jobin.se

## Acknowledgments

We appreciate the security research community's efforts in helping keep Jobin secure. Researchers who report valid vulnerabilities will be acknowledged (with permission) in our security hall of fame.

---

*This security policy is effective as of March 2026 and will be reviewed quarterly.*
