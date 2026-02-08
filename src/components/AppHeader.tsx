import { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  rightActions?: ReactNode;
};

export function AppHeader({
  title,
  showBack = true,
  showHome = true,
  rightActions,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <Appbar.Header>
      {showBack && <Appbar.BackAction onPress={() => router.back()} />}
      <Appbar.Content title={title} />
      {showHome && <Appbar.Action icon="home" onPress={() => router.replace('/')} />}
      {rightActions}
    </Appbar.Header>
  );
}
