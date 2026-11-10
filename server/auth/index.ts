import express from 'express';
import bcrypt from 'bcryptjs';
import { dbService, createAdminSession, validateAdminSession, destroyAdminSession } from '../services/dbService';
import { getLiveFirestoreAdminPin } from '../services/firebaseAdmin';
import { Customer } from '../../src/types';

const router = express.Router();

// Helper to check admin PIN against Firestore
async function checkAdminPin(inputPin?: string): Promise<boolean> {
  if (!inputPin) return false;
  const trimmed = String(inputPin).trim();
  if (trimmed === '1234') return false; // Explicitly block default 1234
  
  const firestorePin = await getLiveFirestoreAdminPin();
  const settings = dbService.getStoreSettings();
  const configuredPin = (firestorePin || settings?.adminPin || process.env.ADMIN_PIN || '').trim();
  if (!configuredPin) return false;

  const normInput = trimmed.replace(/@$/, '');
  const normConfig = configuredPin.replace(/@$/, '');
  return trimmed === configuredPin || normInput === normConfig;
}

// Admin Login / PIN Verification with secure session token
router.post('/login', async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال رمز PIN' });
  }

  if (await checkAdminPin(pin)) {
    const session = createAdminSession();
    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token: session.token,
      expiresAt: session.expiresAt
    });
  }

  return res.status(401).json({ success: false, error: 'رمز PIN الخاص بالإدارة غير صحيح' });
});

// Admin PIN Verification (alias for backwards compatibility)
router.post('/verify-pin', async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN required' });
  }

  if (await checkAdminPin(pin)) {
    const session = createAdminSession();
    return res.json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt
    });
  }

  return res.status(401).json({ success: false, error: 'رمز PIN الخاص بالإدارة غير صحيح' });
});

// Admin Session Token Verification
router.get('/verify-token', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string);

  if (validateAdminSession(token)) {
    return res.json({ success: true, valid: true });
  }
  return res.status(401).json({ success: false, valid: false, error: 'انتهت صلاحية الجلسة' });
});

// Admin Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string);
  if (token) {
    destroyAdminSession(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Customer Registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, password, email, city, address } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ success: false, error: 'الاسم ورقم الهاتف وكلمة المرور مطلوبة' });
    }

    const customers = dbService.getCustomers() as Customer[];
    if (customers.find(c => c.phone === phone)) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      fullName,
      phone,
      password: hashedPassword,
      email,
      city,
      address,
      createdAt: new Date().toISOString()
    } as any;

    dbService.saveCustomer(newCustomer);
    
    // Return customer without password
    const { password: _, ...customerWithoutPassword } = newCustomer as any;
    res.status(201).json({ success: true, customer: customerWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer Login
router.post('/customer-login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف وكلمة المرور مطلوبة' });
    }

    const customers = dbService.getCustomers() as Customer[];
    const customer = customers.find(c => c.phone === phone);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const isMatch = await bcrypt.compare(password, customer.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
    }

    const { password: _, ...customerWithoutPassword } = customer as any;
    res.json({ success: true, customer: customerWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router as express.Router;
