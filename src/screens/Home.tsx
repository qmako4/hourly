import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTasksStore } from '../state/tasksStore';
import { todayYmd, tomorrowYmd } from '../lib/dateUtils';

export default function Home() {
  const tasks = useTasksStore((s) => s.tasks);
  const hydrated = useTasksStore((s) => s.hydrated);

  const buckets = useMemo(() => {
    const today = todayYmd();
    const tomorrow = tomorrowYmd();
    let todayCount = 0;
    let tomorrowCount = 0;
    let laterCount = 0;
    let binCount = 0;
    for (const t of tasks) {
      if (t.completedAt !== null) {
        binCount++;
        continue;
      }
      if (t.targetDate === today) todayCount++;
      else if (t.targetDate === tomorrow) tomorrowCount++;
      else if (t.targetDate > tomorrow) laterCount++;
    }
    return { todayCount, tomorrowCount, laterCount, binCount };
  }, [tasks]);

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>
        today<Text style={styles.dot}>.</Text>
      </Text>
      <Text style={styles.meta}>
        {hydrated ? 'READY' : 'LOADING'}
      </Text>
      <View style={styles.counts}>
        <Text style={styles.count}>TODAY {buckets.todayCount}</Text>
        <Text style={styles.count}>TOMORROW {buckets.tomorrowCount}</Text>
        <Text style={styles.count}>LATER {buckets.laterCount}</Text>
        <Text style={styles.count}>BIN {buckets.binCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  h1: {
    fontSize: 46,
    fontWeight: '600',
    letterSpacing: -2,
    color: '#0a0a0a',
  },
  dot: {
    color: '#c4c4c4',
  },
  meta: {
    marginTop: 12,
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 1.9,
    color: '#999',
  },
  counts: {
    marginTop: 32,
    gap: 8,
  },
  count: {
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 1.9,
    color: '#999',
  },
});
