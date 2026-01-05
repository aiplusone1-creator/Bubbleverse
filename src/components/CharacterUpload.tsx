import { motion } from 'framer-motion';
import { Upload, X, User, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Character {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

interface CharacterUploadProps {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
}

const roleOptions = [
  { value: 'hero', label: 'Hero', icon: Sparkles },
  { value: 'parent', label: 'Parent', icon: User },
  { value: 'pet', label: 'Pet', icon: Heart },
  { value: 'friend', label: 'Friend', icon: User },
];

const CharacterUpload = ({ characters, onAddCharacter, onRemoveCharacter, onUpdateCharacter }: CharacterUploadProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file drop
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onAddCharacter({
          id: Date.now().toString(),
          name: '',
          role: 'hero',
          imageUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onAddCharacter({
          id: Date.now().toString(),
          name: '',
          role: 'hero',
          imageUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Characters</h3>
      <p className="text-muted-foreground text-sm">Upload photos of characters to include in your story</p>
      
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
          accept="image/*"
          onChange={handleFileSelect}
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-foreground font-medium">Drop photos here or click to upload</p>
        <p className="text-muted-foreground text-sm mt-1">PNG, JPG up to 10MB</p>
      </motion.label>

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
              onClick={() => onRemoveCharacter(character.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-destructive" />
            </button>
            
            <div className="flex gap-4">
              {/* Image preview */}
              <div className="w-20 h-20 rounded-xl bg-muted/50 overflow-hidden flex-shrink-0">
                {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Character name"
                  value={character.name}
                  onChange={(e) => onUpdateCharacter(character.id, { name: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
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
