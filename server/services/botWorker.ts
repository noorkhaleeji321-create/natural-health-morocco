import fs from 'fs';
import path from 'path';
import { dbService } from './dbService';
import { Order } from '../../src/types';

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const BACKUPS_DIR = path.join(STORAGE_DIR, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export interface BotStatus {
  status: 'active' | 'warning' | 'error';
  healthScore: number; // 0-100%
  lastBackupAt: string | null;
  lastBackupSizeFormatted: string;
  totalOrdersProcessed: number;
  whatsappConfigured: boolean;
  whatsappNumber: string;
  activeNotificationsCount: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
}

const botLogs: string[] = [];

function logBot(msg: string) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const formatted = `[WhatsAppWorker ${timestamp}] ${msg}`;
  console.log(formatted);
  botLogs.unshift(formatted);
  if (botLogs.length > 50) botLogs.pop();
}

let lastBackupTimestamp: string | null = null;
let lastBackupSizeBytes = 0;
let ordersProcessedCount = 0;
const startTime = Date.now();

/**
 * Formats a clean, readable notification for new incoming orders
 */
export function formatOrderNotificationMessage(order: Order): string {
  const customerName = order.customer?.fullName || 'زبون جديد';
  const customerCity = order.customer?.city || 'المغرب';
  const customerPhone = order.customer?.phone || 'غير محدد';
  const customerAddress = order.customer?.address || 'غير محدد';
  const totalAmount = order.total || 0;
  const paymentType = order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'الدفع عند الاستلام';

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `• ${item.product?.name || (item as any).name || 'منتج'} (x${item.quantity || 1}) - ${
          (item.product?.price || (item as any).price || 0) * (item.quantity || 1)
        } درهم`
    )
    .join('\n');

  return `📦 *طلب جديد من المتجر* #${order.id}
━━━━━━━━━━━━━━━━━━
👤 *الزبون:* ${customerName}
📍 *المدينة:* ${customerCity}
🏠 *العنوان:* ${customerAddress}
📞 *الهاتف:* ${customerPhone}
💳 *طريقة الدفع:* ${paymentType}

🛒 *تفاصيل السلة:*
${itemsList || '• منتجات متنوعة'}

💰 *المجموع الإجمالي:* *${totalAmount} درهم*
⏰ *الوقت:* ${new Date().toLocaleString('ar-MA', { timeZone: 'Africa/Casablanca' })}`;
}

/**
 * Generates direct WhatsApp URL to send notification to seller phone without API Token
 */
export function formatWhatsAppOrderUrl(order: Order, whatsappNumber?: string): string {
  const settings = dbService.getStoreSettings();
  const rawPhone = whatsappNumber || settings?.whatsapp || '212775044615';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const message = formatOrderNotificationMessage(order);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Triggers instant order dispatch workflow and runs auto backup
 */
export async function notifyNewOrder(order: Order, whatsappNumber?: string): Promise<{ whatsappUrl: string }> {
  ordersProcessedCount++;
  logBot(`New Order Dispatched: #${order.id}`);

  const whatsappUrl = formatWhatsAppOrderUrl(order, whatsappNumber);

  // Trigger auto backup on new order
  runAutomaticBackup();

  return { whatsappUrl };
}

/**
 * Creates an automatic JSON backup snapshot of the database
 */
export function runAutomaticBackup(): { success: boolean; filePath?: string; sizeBytes?: number } {
  try {
    const backupData = {
      backupTimestamp: new Date().toISOString(),
      type: 'automated_snapshot',
      products: dbService.getProducts(),
      categories: dbService.getCategories(),
      orders: dbService.getOrders(),
      customers: dbService.getCustomers(),
      storeSettings: dbService.getStoreSettings(),
      bankSettings: dbService.getBankSettings(),
      heroSlides: dbService.getHeroSlides(),
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const backupFilePath = path.join(BACKUPS_DIR, 'auto_backup_latest.json');
    fs.writeFileSync(backupFilePath, jsonStr, 'utf-8');

    lastBackupTimestamp = new Date().toISOString();
    lastBackupSizeBytes = Buffer.byteLength(jsonStr);

    logBot(`Automated Database Backup completed (${(lastBackupSizeBytes / 1024).toFixed(1)} KB)`);
    return { success: true, filePath: backupFilePath, sizeBytes: lastBackupSizeBytes };
  } catch (err: any) {
    logBot(`Automated Backup Error: ${err.message}`);
    return { success: false };
  }
}

/**
 * Get current system & bot health metrics
 */
export function getBotStatus(whatsappNumber?: string): BotStatus {
  const mem = process.memoryUsage();
  const memoryUsageMB = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const settings = dbService.getStoreSettings();
  const activeNumber = whatsappNumber || settings?.whatsapp || '212775044615';
  const isWhatsAppSet = !!activeNumber && activeNumber.replace(/[^0-9]/g, '').length >= 9;

  return {
    status: 'active',
    healthScore: 100,
    lastBackupAt: lastBackupTimestamp,
    lastBackupSizeFormatted: lastBackupSizeBytes
      ? `${(lastBackupSizeBytes / 1024).toFixed(1)} KB`
      : 'غير متوفر',
    totalOrdersProcessed: ordersProcessedCount,
    whatsappConfigured: isWhatsAppSet,
    whatsappNumber: activeNumber,
    activeNotificationsCount: botLogs.length,
    memoryUsageMB,
    uptimeSeconds,
  };
}

export function getBotLogs(): string[] {
  return [...botLogs];
}

// Initialize worker timer: Auto backup every 6 hours
setInterval(() => {
  runAutomaticBackup();
}, 6 * 60 * 60 * 1000);

// Run initial backup on startup
setTimeout(() => {
  runAutomaticBackup();
}, 5000);
