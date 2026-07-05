import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface DateOfBirthPickerProps {
  label?: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (isoDate: string) => void;
  error?: string;
  minAge?: number;
  maxAge?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type FieldKind = 'day' | 'month' | 'year' | null;

const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  label = 'Date of Birth (Optional)',
  value,
  onChange,
  error,
  minAge = 18,
  maxAge = 100,
}) => {
  const theme = useTheme();
  const [openField, setOpenField] = useState<FieldKind>(null);

  // Local state is the source of truth for what's displayed — each field
  // updates immediately when picked, independent of whether the other two
  // are set yet. `onChange` only fires once all three combine into a real
  // date, but the user always sees their picks reflected right away.
  const [initialYear, initialMonth, initialDay] = value ? value.split('-') : ['', '', ''];
  const [day, setDay] = useState<number | null>(initialDay ? parseInt(initialDay, 10) : null);
  const [month, setMonth] = useState<number | null>(initialMonth ? parseInt(initialMonth, 10) : null);
  const [year, setYear] = useState<number | null>(initialYear ? parseInt(initialYear, 10) : null);

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - maxAge;
  const maxYear = currentYear - minAge;
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const commit = (nextDay: number | null, nextMonth: number | null, nextYear: number | null) => {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);

    if (nextDay == null || nextMonth == null || nextYear == null) {
      // Not all three parts chosen yet — nothing to propagate upward.
      return;
    }
    const check = new Date(nextYear, nextMonth - 1, nextDay);
    const isRealDate = check.getFullYear() === nextYear
      && check.getMonth() === nextMonth - 1
      && check.getDate() === nextDay;

    if (!isRealDate) {
      // e.g. 30 Feb — keep the day/month/year shown, but don't propagate an
      // impossible date. User will see the day picker again to correct it.
      return;
    }
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`);
  };

  const selectDay = (d: number) => { commit(d, month, year); setOpenField(null); };
  const selectMonth = (m: number) => { commit(day, m, year); setOpenField(null); };
  const selectYear = (y: number) => { commit(day, month, y); setOpenField(null); };

  const renderField = (kind: FieldKind, label: string, displayValue: string) => (
    <TouchableOpacity
      style={[styles.field, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
      onPress={() => setOpenField(kind)}
      activeOpacity={0.7}
    >
      <Text style={[styles.fieldText, { color: displayValue ? theme.colors.text : theme.colors.textLight }]}>
        {displayValue || label}
      </Text>
      <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const modalData: { title: string; items: { key: string; label: string; onPress: () => void }[] } | null =
    openField === 'day'
      ? { title: 'Day', items: days.map(d => ({ key: String(d), label: String(d), onPress: () => selectDay(d) })) }
      : openField === 'month'
        ? { title: 'Month', items: MONTHS.map((m, i) => ({ key: m, label: m, onPress: () => selectMonth(i + 1) })) }
        : openField === 'year'
          ? { title: 'Year', items: years.map(y => ({ key: String(y), label: String(y), onPress: () => selectYear(y) })) }
          : null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.row}>
        {renderField('day', 'DD', day ? String(day) : '')}
        {renderField('month', 'Month', month ? MONTHS[month - 1] : '')}
        {renderField('year', 'YYYY', year ? String(year) : '')}
      </View>
      {!!error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Modal visible={!!openField} transparent animationType="fade" onRequestClose={() => setOpenField(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpenField(null)}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>{modalData?.title}</Text>
            <FlatList
              data={modalData?.items || []}
              keyExtractor={item => item.key}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={item.onPress}>
                  <Text style={[styles.listItemText, { color: theme.colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fieldText: { fontSize: 14, fontWeight: '500' },
  errorText: { fontSize: 12, marginTop: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center' },
  sheet: { width: '70%', maxHeight: '60%', borderRadius: 16, paddingVertical: 16 },
  sheetTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  list: { paddingHorizontal: 8 },
  listItem: { paddingVertical: 12, alignItems: 'center' },
  listItemText: { fontSize: 15 },
  separator: { height: 1, marginHorizontal: 8 },
});

export default DateOfBirthPicker;
