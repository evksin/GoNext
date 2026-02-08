import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { PRIMARY_COLORS } from '../../src/theme/paperTheme';
import { setLanguage } from '../../src/i18n';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const {
    themeMode,
    fontScale,
    primaryColor,
    setThemeMode,
    setFontScale,
    setPrimaryColor,
  } = useSettings();
  const { t, i18n } = useTranslation();
  const [backupText, setBackupText] = useState('');
  const [message, setMessage] = useState('');
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthItems, setHealthItems] = useState<HealthItem[]>([]);

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      setMessage(t('settings.exportUnavailable'));
      return;
    }
    setLoading(true);
    try {
      const data = await exportDatabase();
      setBackupText(data);
      setMessage(t('settings.exportOk'));
    } catch {
      setMessage(t('settings.exportFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      setMessage(t('settings.importUnavailable'));
      return;
    }
    if (!backupText.trim()) {
      setMessage(t('settings.pasteImport'));
      return;
    }
    setLoading(true);
    try {
      await importDatabase(backupText);
      setMessage(t('settings.importOk'));
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_BACKUP_FORMAT') {
        setMessage(t('settings.importInvalid'));
      } else {
        setMessage(t('settings.importFail'));
      }
    } finally {
      setLoading(false);
      setConfirmImportVisible(false);
    }
  };

  const handleClear = async () => {
    if (Platform.OS === 'web') {
      setMessage(t('settings.clearUnavailable'));
      return;
    }
    setLoading(true);
    try {
      await clearDatabase();
      await clearPhotosDirectory();
      setBackupText('');
      setMessage(t('settings.clearOk'));
    } catch {
      setMessage(t('settings.clearFail'));
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
      setMessage(t('settings.checkDone'));
    } catch {
      setMessage(t('settings.checkFail'));
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.screen}>
        <AppHeader title={t('settings.title')} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <Text style={styles.sectionSubtitle}>{t('settings.language')}</Text>
          <SegmentedButtons
            value={i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru'}
            onValueChange={(value) => setLanguage(value as 'ru' | 'en')}
            buttons={[
              { value: 'ru', label: t('settings.languageRu') },
              { value: 'en', label: t('settings.languageEn') },
            ]}
          />
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => setThemeMode(value as typeof themeMode)}
            buttons={[
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
          <SegmentedButtons
            value={fontScale}
            onValueChange={(value) => setFontScale(value as typeof fontScale)}
            buttons={[
              { value: 'normal', label: t('settings.fontNormal') },
              { value: 'large', label: t('settings.fontLarge') },
            ]}
          />
          <Text style={styles.sectionSubtitle}>{t('settings.primaryColor')}</Text>
          <View style={styles.colorRow}>
            {PRIMARY_COLORS.map((color) => {
              const selected = color === primaryColor;
              return (
                <Pressable
                  key={color}
                  onPress={() => setPrimaryColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selected && styles.colorDotSelected,
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t('settings.exportImport')}</Text>
          <TextInput
            label={t('settings.dataJson')}
            value={backupText}
            onChangeText={setBackupText}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />
          <View style={styles.buttonRow}>
            <Button mode="outlined" onPress={handleExport} loading={loading}>
              {t('settings.export')}
            </Button>
            <Button
              mode="contained"
              onPress={() => setConfirmImportVisible(true)}
              disabled={loading}
            >
              {t('settings.import')}
            </Button>
          </View>

          <Text style={styles.sectionTitle}>{t('settings.clear')}</Text>
          <Button
            mode="contained"
            onPress={() => setConfirmClearVisible(true)}
            disabled={loading}
          >
            {t('settings.clearData')}
          </Button>

          <Text style={styles.sectionTitle}>{t('settings.offlineCheck')}</Text>
          <Button
            mode="outlined"
            onPress={handleHealthCheck}
            loading={healthLoading}
          >
            {t('settings.runCheck')}
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

          <Text style={styles.sectionTitle}>{t('settings.checklist')}</Text>
          <List.Section>
            <List.Item title={t('settings.checklistPlace')} />
            <List.Item title={t('settings.checklistTrip')} />
            <List.Item title={t('settings.checklistNotes')} />
            <List.Item title={t('settings.checklistNext')} />
            <List.Item title={t('settings.checklistSearch')} />
            <List.Item title={t('settings.checklistBackup')} />
          </List.Section>
        </ScrollView>

        <Portal>
          <Dialog
            visible={confirmClearVisible}
            onDismiss={() => setConfirmClearVisible(false)}
          >
            <Dialog.Title>{t('settings.clearDialogTitle')}</Dialog.Title>
            <Dialog.Content>
              <Text>{t('settings.clearDialogText')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmClearVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button onPress={handleClear}>{t('common.delete')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={confirmImportVisible}
            onDismiss={() => setConfirmImportVisible(false)}
          >
            <Dialog.Title>{t('settings.importDialogTitle')}</Dialog.Title>
            <Dialog.Content>
              <Text>{t('settings.importDialogText')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmImportVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button onPress={handleImport}>{t('settings.import')}</Button>
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
  sectionSubtitle: {
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#000000',
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
