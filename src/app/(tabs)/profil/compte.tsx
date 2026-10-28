import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AvatarPicker } from '@/components/screens/profile/AvatarPicker';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { AppText, Avatar, BottomSheet, ListCard, ListRow, useToast, Tappable } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';
import { color, radius, space, text } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Figma : « Profil/ Compte » — avatar, nom d'utilisateur et adresse mail. */
export default function CompteScreen() {
  const { account, setAccount, avatar, setAvatar } = useProfile();
  const toast = useToast();
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [emailError, setEmailError] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Enregistré en quittant le champ ; un champ vidé reprend sa valeur précédente.
  const saveName = () => {
    if (name.trim()) setAccount({ ...account, name: name.trim() });
    else setName(account.name);
  };
  const saveEmail = () => {
    const value = email.trim();
    if (!value) return setEmail(account.email);
    const valid = EMAIL.test(value);
    setEmailError(!valid);
    if (valid) setAccount({ ...account, email: value });
  };

  const fromLibrary = async () => {
    setPhotoOpen(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatar({ kind: 'photo', uri: result.assets[0].uri });
  };

  return (
    <>
      <ProfileScreen title="Compte" back toast={toast}>
        <View style={styles.card}>
          <AppText variant="overline" color={color.textSecondary}>
            Avatar
          </AppText>
          <Tappable
            feedback="card"
            accessibilityRole="button"
            accessibilityLabel="Modifier la photo"
            onPress={() => setPhotoOpen(true)}
            style={styles.avatar}>
            <Avatar avatar={avatar} size={80} />
            <View style={styles.badge}>
              <Icon name="edit" size={16} color={color.actionSecondaryIcon} />
            </View>
          </Tappable>

          <AppText variant="overline" color={color.textSecondary} nativeID="nom">
            Nom d’utilisateur
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={saveName}
            onSubmitEditing={saveName}
            accessibilityLabelledBy="nom"
            accessibilityLabel="Nom d’utilisateur"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            style={styles.field}
          />

          <AppText variant="overline" color={color.textSecondary} nativeID="email">
            Adresse mail
          </AppText>
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (emailError) setEmailError(false);
            }}
            onBlur={saveEmail}
            onSubmitEditing={saveEmail}
            accessibilityLabelledBy="email"
            accessibilityLabel="Adresse mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            style={[styles.field, emailError && styles.fieldError]}
          />
          {emailError && (
            <AppText variant="label" color={color.feedbackDanger} accessibilityLiveRegion="polite">
              Cette adresse ne ressemble pas à une adresse mail.
            </AppText>
          )}
        </View>
      </ProfileScreen>

      <BottomSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} title="Modifier la photo">
        <ListCard>
          <ListRow
            leading={<Icon name="images" color={color.actionSecondaryIcon} />}
            label="Choisir un avatar Toqué"
            onPress={() => {
              setPhotoOpen(false);
              setPickerOpen(true);
            }}
          />
          <ListRow
            leading={<Icon name="camera" color={color.actionSecondaryIcon} />}
            label="Choisir depuis la galerie"
            onPress={fromLibrary}
          />
        </ListCard>
      </BottomSheet>

      <AvatarPicker
        visible={pickerOpen}
        initial={avatar}
        onClose={() => setPickerOpen(false)}
        onSave={(next) => {
          setAvatar(next);
          setPickerOpen(false);
          toast.show('Avatar enregistré');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[16],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  avatar: {
    alignSelf: 'flex-start',
  },
  badge: {
    position: 'absolute',
    right: -18,
    bottom: 0,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
  },
  field: {
    ...text.body,
    height: 48,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
    // Sur le web, le contour de focus du navigateur s'ajouterait au liseré du champ.
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  fieldError: {
    borderColor: color.feedbackDanger,
  },
});
