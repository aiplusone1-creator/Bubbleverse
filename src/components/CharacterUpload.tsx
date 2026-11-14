import { motion } from 'framer-motion';
import { Upload, X, User, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { readCharacterPhoto } from '@/lib/characterPhoto';
import { useLanguage } from '@/hooks/useLanguage';

import type { Character } from '@/features/stories/types';

interface CharacterUploadProps {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
}

const CharacterUpload = ({ characters, onAddCharacter, onRemoveCharacter, onUpdateCharacter }: CharacterUploadProps) => {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [readingPhoto, setReadingPhoto] = useState(false);

  const roleOptions = [
    { value: 'hero', label: t('roleHero'), icon: Sparkles },
    { value: 'parent', label: t('roleParent'), icon: User },
    { value: 'pet', label: t('rolePet'), icon: Heart },
    { value: 'friend', label: t('roleFriend'), icon: User },
  ];

  const mapPhotoError = (error: unknown): string => {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('smaller than 10 MB')) return t('photoTooLarge');
    if (msg.includes('valid PNG or JPG')) return t('photoInvalidType');
    if (msg.includes('at most 24 megapixels')) return t('photoTooManyPixels');
    if (msg.includes('could not be opened')) return t('photoCannotOpen');
    if (msg.includes('could not be read')) return t('photoCannotRead');
    return t('photoGenericError');
  };

  const addPhoto = async (file: File) => {
    if (readingPhoto) return;
    setPhotoError('');
    setReadingPhoto(true);
    try {
      const imageUrl = await readCharacterPhoto(file);
      onAddCharacter({ id: crypto.randomUUID(), name: '', role: 'hero', imageUrl });
    } catch (error) {
      setPhotoError(mapPhotoError(error));
    } finally {
      setReadingPhoto(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) void addPhoto(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) void addPhoto(files[0]);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">{t('charactersTitle')}</h3>
      <p className="text-muted-foreground text-sm">{t('charactersDesc')}</p>
      
      {/* Upload Zone */}
      <motion.label
        className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          dragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
      >
        <input 
          type="file" 
          className="hidden" 
          accept="image/png,image/jpeg"
          disabled={readingPhoto}
          onChange={handleFileSelect}
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-foreground font-medium">{readingPhoto ? t('checkingPhoto') : t('dropPhotosOrClick')}</p>
        <p className="text-muted-foreground text-sm mt-1">{t('photoSpecs')}</p>
      </motion.label>
      {photoError && <p role="alert" className="text-sm text-destructive">{photoError}</p>}

      {/* Character Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {characters.map((character, index) => (
          <motion.div
            key={character.id}
            className="glass-card p-4 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
          >
            <button 
              type="button"
              onClick={() => onRemoveCharacter(character.id)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus:outline-none cursor-pointer"
              aria-label={t('removeCharacter')}
            >
              <X className="w-4 h-4 text-destructive" />
            </button>
            
            <div className="flex gap-4">
              {/* Image preview */}
              <div className="w-20 h-20 rounded-xl bg-muted/50 overflow-hidden flex-shrink-0">
                {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name || t('roleHero')} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`${t('characterNamePlaceholder')} *`}
                    value={character.name}
                    onChange={(e) => onUpdateCharacter(character.id, { name: e.target.value })}
                    className={`w-full bg-muted/30 border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      !character.name.trim() ? 'border-destructive/50' : 'border-border'
                    }`}
                  />
                  {!character.name.trim() && (
                    <span className="absolute -top-2 right-2 text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">
                      *
                    </span>
                  )}
                </div>
                <select
                  value={character.role}
                  onChange={(e) => onUpdateCharacter(character.id, { role: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CharacterUpload;
