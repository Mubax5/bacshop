import Link from "next/link";
import type { NotificationRecord } from "@/domain/notifications/types";
import { PageHeading, PageWidth } from "@/ui/foundations/primitives";

const labels = { payment: "Pembayaran", processing: "Diproses", activation: "Aktivasi", issue: "Perlu perhatian", expiry: "Masa aktif" } as const;

export function NotificationSurface({ notifications }: { notifications: NotificationRecord[] }) {
  return <main className="retail-page"><PageWidth><PageHeading eyebrow="AKUN CUSTOMER" title="Notifikasi" description="Update pembayaran, proses aktivasi, masalah pesanan, dan pengingat masa aktif." />{notifications.length === 0 ? <section className="retail-empty"><h2>Belum ada notifikasi</h2><p>Update pesanan dan aktivasi akan muncul di sini.</p><Link className="button button--primary" href="/shop">Jelajahi produk</Link></section> : <div className="notification-list">{notifications.map((notification) => <article className="notification-card" key={notification.id}><span className={`notification-kind notification-kind--${notification.kind}`}>{labels[notification.kind]}</span><div><h2>{notification.title}</h2><p>{notification.body}</p><time dateTime={notification.createdAt}>{notification.createdAt === new Date(0).toISOString() ? "Development" : new Date(notification.createdAt).toLocaleString("id-ID")}</time></div>{notification.orderId && <Link href={`/account/orders/${notification.orderId}`}>Lihat pesanan</Link>}</article>)}</div>}</PageWidth></main>;
}
