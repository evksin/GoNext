import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import {
  Button,
  Dialog,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

import { ScreenBackground } from '../../src/components/ScreenBackground';
import { AppHeader } from '../../src/components/AppHeader';
import { useSettings } from '../../src/contexts/SettingsContext';
import { clearDatabase, exportDatabase, importDatabase } from '../../src/data/backup';
import { clearPhotosDirectory } from '../../src/services/storage';
import { HealthItem, runOfflineCheck } from '../../src/services/healthCheck';

export default function SettingsScreen() {
  const { themeMode, fontScale, setThemeMode, setFontScale } = useSettings();
  const [backupText, setBackupText] = useState('');
  const [message, setMessage] = useState('');
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthItems, setHealthItems] = useState<HealthItem[]>([]);

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      setMessage('Экспорт недоступен в браузере.');
      return;
    }
    setLoading(true);
    try {
      const data = await exportDatabase();
      setBackupText(data);
      setMessage('Экспорт выполнен.');
    } catch {
      setMessage('Не удалось выполнить экспорт.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      setMessage('Импорт недоступен в браузере.');
      return;
    }
    if (!backupText.trim()) {
      setMessage('Вставьте данные для импорта.');
      return;
    }
    setLoading(true);
    try {
      await importDatabase(backupText);
      setMessage('Импорт выполнен.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Импорт не удался.');
    } finally {
      setLoading(false);
      setConfirmImportVisible(false);
    }
  };

  const handleClear = async () => {
    if (Platform.OS === 'web') {
      setMessage('Очистка недоступна в браузере.');
      return;
    }
    setLoading(true);
    try {
      await clearDatabase();
      await clearPhotosDirectory();
      setBackupText('');
      setMessage('Данные и фото удалены.');
    } catch {
      setMessage('Не удалось очистить данные.');
    } finally {
      setLoading(false);
      setConfirmClearVisible(false);
    }
  };

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const results = await runOfflineCheck();
      setHealthItems(results);
      setMessage('Проверка завершена.');
    } catch {
      setMessage('Не удалось выполнить проверку.');
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title="Настройки" />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Внешний вид</Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as typeof themeMode)}
            buttons={[
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Тёмная' },
            ]}
          />
          <SegmentedButtons
            value={fontScale}
            onValueChange={(value) => setFontScale(value as typeof fontScale)}
            buttons={[
              { value: 'normal', label: 'Обычный' },
              { value: 'large', label: 'Крупный' },
            ]}
          />

          <Text style={styles.sectionTitle}>Экспорт / импорт</Text>
          <TextInput
            label="Данные (JSON)"
            value={backupText}
            onChangeText={setBackupText}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />
          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={handleExport} loading={loading}>
              Экспортировать
            </Button>
            <Button
              mode="contained"
              onPress={() => setConfirmImportVisible(true)}
              disabled={loading}
            >
              Импортировать
            </Button>
          </View>

          <Text style={styles.sectionTitle}>Очистка</Text>
          <Button
            mode="contained"
            onPress={() => setConfirmClearVisible(true)}
            disabled={loading}
          >
            Очистить данные и фото
          </Button>

          <Text style={styles.sectionTitle}>Проверка офлайн</Text>
          <Button
            mode="outlined"
            onPress={handleHealthCheck}
            loading={healthLoading}
          >
            Запустить проверку
          </Button>
          {healthItems.length > 0 && (
            <List.Section>
              {healthItems.map((item, index) => (
                <List.Item
                  key={`${item.label}-${index}`}
                  title={item.label}
                  description={item.details}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={item.ok ? 'check-circle' : 'alert-circle'}
                    />
                  )}
                />
              ))}
            </List.Section>
          )}

          <Text style={styles.sectionTitle}>Чек-лист сценариев</Text>
          <List.Section>
            <List.Item title="Создать и отредактировать место" />
            <List.Item title="Создать поездку и добавить места" />
            <List.Item title="Отметить посещение, заметки, фото" />
            <List.Item title="Проверить «Следующее место»" />
            <List.Item title="Проверить поиск по тексту/тегам/году" />
            <List.Item title="Сделать экспорт/импорт" />
          </List.Section>
        </ScrollView>

        <Portal>
          <Dialog
            visible={confirmClearVisible}
            onDismiss={() => setConfirmClearVisible(false)}
          >
            <Dialog.Title>Удалить данные?</Dialog.Title>
            <Dialog.Content>
              <Text>Будут удалены все места, поездки, теги и фото.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmClearVisible(false)}>Отмена</Button>
              <Button onPress={handleClear}>Удалить</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={confirmImportVisible}
            onDismiss={() => setConfirmImportVisible(false)}
          >
            <Dialog.Title>Импортировать данные?</Dialog.Title>
            <Dialog.Content>
              <Text>Текущие данные будут заменены.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmImportVisible(false)}>Отмена</Button>
              <Button onPress={handleImport}>Импортировать</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={Boolean(message)}
          onDismiss={() => setMessage('')}
          duration={2500}
        >
          {message}
        </Snackbar>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  textArea: {
    minHeight: 140,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
