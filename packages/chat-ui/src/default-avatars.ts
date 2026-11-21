export type MemberGender = 'male' | 'female';

export const ANONYMOUS_VISITOR_AVATAR_URL = '/avatars/guest.png';

const MEMBER_AVATAR_URLS: Record<MemberGender, string> = {
  male: '/avatars/m.png',
  female: '/avatars/w.png',
};

export function getDefaultMemberAvatarUrl(gender: unknown): string | null {
  return gender === 'male' || gender === 'female' ? MEMBER_AVATAR_URLS[gender] : null;
}
