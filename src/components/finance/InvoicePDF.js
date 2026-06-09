import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  logo: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1e40af' },
  logoSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  invoiceTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#1e293b', textAlign: 'right' },
  invoiceNumber: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 4, fontFamily: 'Helvetica' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 11, color: '#64748b' },
  value: { fontSize: 11, color: '#1e293b', fontFamily: 'Helvetica-Bold' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: '8 12', borderRadius: 4 },
  tableHeaderText: { fontSize: 10, color: '#64748b', fontFamily: 'Helvetica-Bold', flex: 1 },
  tableRow: { flexDirection: 'row', padding: '8 12', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCell: { fontSize: 11, color: '#1e293b', flex: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '10 12', backgroundColor: '#f8fafc', borderRadius: 4, marginTop: 8 },
  totalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  totalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1e40af' },
  statusBadge: { padding: '4 10', borderRadius: 20, alignSelf: 'flex-start' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94a3b8' },
})

export default function InvoicePDF({ invoice, booking, customer }) {
  const vehicle = booking?.vehicles
  const statusColors = {
    paid: '#16a34a',
    pending: '#d97706',
    partial: '#2563eb',
    overdue: '#dc2626',
  }

  const lineItems = [
    { desc: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} — ${booking?.total_days} day(s) @ $${invoice.subtotal / (booking?.total_days || 1)}/day` : 'Car Rental', amount: invoice.subtotal },
    invoice.tax_amount > 0 && { desc: 'Tax', amount: invoice.tax_amount },
    invoice.discount_amount > 0 && { desc: 'Discount', amount: -invoice.discount_amount },
    invoice.late_fee > 0 && { desc: 'Late Fee', amount: invoice.late_fee },
    invoice.damage_fee > 0 && { desc: 'Damage Fee', amount: invoice.damage_fee },
    invoice.fuel_charge > 0 && { desc: 'Fuel Charge', amount: invoice.fuel_charge },
    invoice.driver_charge > 0 && { desc: 'Driver Charge', amount: invoice.driver_charge },
  ].filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>CarRental</Text>
            <Text style={styles.logoSub}>Fleet & Accounts Management</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer & Invoice info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginBottom: 3 }}>
              {customer?.full_name ?? 'Customer'}
            </Text>
            {customer?.phone && (
              <Text style={{ fontSize: 11, color: '#64748b' }}>{customer.phone}</Text>
            )}
            {customer?.address && (
              <Text style={{ fontSize: 11, color: '#64748b' }}>{customer.address}</Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Status: </Text>
              <Text style={{ fontSize: 11, color: statusColors[invoice.status] ?? '#64748b', fontFamily: 'Helvetica-Bold', textTransform: 'capitalize' }}>
                {invoice.status}
              </Text>
            </View>
            {invoice.due_date && (
              <Text style={{ fontSize: 11, color: '#64748b' }}>
                Due: {new Date(invoice.due_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </Text>
            )}
            {booking && (
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Booking: {booking.booking_number}
              </Text>
            )}
          </View>
        </View>

        {/* Booking dates */}
        {booking && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View>
                <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Pickup</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', fontFamily: 'Helvetica-Bold' }}>
                  {new Date(booking.pickup_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Return</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', fontFamily: 'Helvetica-Bold' }}>
                  {new Date(booking.return_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>Duration</Text>
                <Text style={{ fontSize: 12, color: '#1e293b', fontFamily: 'Helvetica-Bold' }}>
                  {booking.total_days} day{booking.total_days > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Line items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Amount</Text>
            </View>
            {lineItems.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.desc}</Text>
                <Text style={[styles.tableCell, { textAlign: 'right', color: item.amount < 0 ? '#16a34a' : '#1e293b' }]}>
                  {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '6 12', marginBottom: 2 }}>
            <Text style={{ fontSize: 11, color: '#64748b' }}>Subtotal</Text>
            <Text style={{ fontSize: 11, color: '#1e293b' }}>${invoice.subtotal?.toFixed(2)}</Text>
          </View>
          {invoice.amount_paid > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '6 12', marginBottom: 2 }}>
              <Text style={{ fontSize: 11, color: '#16a34a' }}>Amount Paid</Text>
              <Text style={{ fontSize: 11, color: '#16a34a' }}>-${invoice.amount_paid?.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {invoice.balance_due > 0 ? 'Balance Due' : 'Total Paid'}
            </Text>
            <Text style={[styles.totalValue, { color: invoice.balance_due > 0 ? '#dc2626' : '#16a34a' }]}>
              ${invoice.balance_due > 0 ? invoice.balance_due?.toFixed(2) : invoice.total_amount?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && !invoice.notes.startsWith('Paynow poll:') && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 11, color: '#64748b' }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          CarRental — Fleet & Accounts Management · Generated {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  )
}