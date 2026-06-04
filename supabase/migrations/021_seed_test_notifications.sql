-- TEKODAK OPS — 021_seed_test_notifications.sql
-- Test bildirimleri: her aktif kullanıcı için okunmuş + okunmamış örnekler.
-- Güvenli tekrar çalıştırma: aynı test başlığı varsa atlanır.

INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  entity_type,
  entity_id,
  action_url,
  priority,
  is_read,
  read_at,
  created_at
)
SELECT
  u.id,
  s.type,
  s.title,
  s.message,
  s.entity_type,
  NULL,
  s.action_url,
  s.priority,
  s.is_read,
  CASE WHEN s.is_read THEN NOW() - s.read_ago ELSE NULL END,
  NOW() - s.created_ago
FROM users u
CROSS JOIN (
  VALUES
    (
      'contract_renewal'::text,
      'Sözleşme yenileme yaklaşıyor'::text,
      'ABC Ltd. sözleşmesinin bitiş tarihi 18 gün içinde.'::text,
      'contract'::text,
      '/contracts'::text,
      'high'::text,
      false,
      NULL::interval,
      interval '12 minutes'
    ),
    (
      'critical_stock',
      'Kritik stok uyarısı',
      'Bıçak seti stoku minimum seviyenin altında.',
      'part',
      '/stock',
      'urgent',
      false,
      NULL::interval,
      interval '2 hours'
    ),
    (
      'work_order_assigned',
      'Yeni iş emri atandı',
      'İE-2026-014 size atandı — planlanan: yarın 10:00.',
      'work_order',
      '/work-orders',
      'normal',
      false,
      NULL::interval,
      interval '35 minutes'
    ),
    (
      'work_order_completed',
      'İş emri tamamlandı',
      'İE-2026-011 tamamlandı ve kapatıldı.',
      'work_order',
      '/work-orders',
      'normal',
      true,
      interval '3 hours',
      interval '1 day'
    ),
    (
      'contract_new',
      'Yeni sözleşme eklendi',
      'XYZ A.Ş. için yeni bakım sözleşmesi oluşturuldu.',
      'contract',
      '/contracts',
      'normal',
      true,
      interval '1 day',
      interval '2 days'
    )
) AS s(
  type,
  title,
  message,
  entity_type,
  action_url,
  priority,
  is_read,
  read_ago,
  created_ago
)
WHERE u.is_active = TRUE
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.user_id = u.id
      AND n.title = s.title
      AND n.type = s.type
  );
