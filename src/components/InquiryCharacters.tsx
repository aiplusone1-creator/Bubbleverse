import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import type { Character } from '@/features/stories/types';

interface Props {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
}

const roles = ['hero', 'parent', 'pet', 'friend'];

export default function InquiryCharacters({ characters, onAddCharacter, onRemoveCharacter, onUpdateCharacter }: Props) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{t('charactersTitle')}</h3>
      <p className="text-sm text-muted-foreground">{t('inquiryPhotosLater')}</p>
      {characters.map((character, index) => (
        <div key={character.id} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
          <label className="min-w-0 space-y-1">
            <span className="block text-sm">{t('inquiryCharacterName')} {index + 1}</span>
            <Input className="h-11 text-base" maxLength={80} value={character.name} onChange={event => onUpdateCharacter(character.id, { name: event.target.value })} />
          </label>
          <label className="min-w-0 space-y-1">
            <span className="block text-sm">{t('inquiryRole')}</span>
            <select className="h-11 w-full rounded-md border border-input bg-background px-2 text-base" value={character.role} onChange={event => onUpdateCharacter(character.id, { role: event.target.value })}>
              {roles.map(role => <option key={role} value={role}>{t('role' + role[0].toUpperCase() + role.slice(1))}</option>)}
            </select>
          </label>
          <Button type="button" variant="outline" className="min-h-11 self-end" onClick={() => onRemoveCharacter(character.id)}>{t('removeCharacter')}</Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="min-h-11" disabled={characters.length >= 6} onClick={() => onAddCharacter({ id: crypto.randomUUID(), name: '', role: characters.length ? 'friend' : 'hero' })}>{t('inquiryAddCharacter')}</Button>
    </div>
  );
}
