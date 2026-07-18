'use client';

import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} from '@/lib/services/notificationsApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import { useToast } from '@/lib/hooks';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { TrashIcon } from '@/components/icons';

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 50 });
  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkNotificationReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const toast = useToast();

  const { items } = unwrapList(data);

  return (
    <>
      <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Notifications</h1>
          <p>Updates about your attendance, leave &amp; payroll</p>
        </div>
        <button
          className="btn btn-g btn-sm"
          onClick={async () => {
            await markAllRead();
            toast('All marked as read');
          }}
        >
          Mark all read
        </button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          items.map((n) => (
            <div key={n._id} className="litem" style={{ opacity: n.isRead ? 0.6 : 1 }}>
              <div className="linfo">
                <div className="ldate-label">{n.title}</div>
                <div className="lreason">{n.message}</div>
                <div className="ldays-label" style={{ color: 'var(--g400)' }}>
                  {fmtDate(n.createdAt)} · {fmtTime(n.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                {!n.isRead ? (
                  <button className="btn btn-g btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => markRead(n._id)}>
                    Mark read
                  </button>
                ) : null}
                <button className="ib del" onClick={() => deleteNotification(n._id)} title="Delete">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState>No notifications yet</EmptyState>
        )}
      </div>
    </>
  );
}
