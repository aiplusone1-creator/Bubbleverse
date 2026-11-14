import type { validateStoryRequest } from './requestValidation.ts';

export type StoryInput = ReturnType<typeof validateStoryRequest>;

export function buildStoryPrompts(input: StoryInput, pageCount: number) {
  const { language, characters, interests, format, plotMode, customPlot } = input;
  const artStyle = input.artStyle === 'custom' ? input.customArtStyle : input.artStyle;
  const hero = (characters.find(c => c.role === 'hero') || characters[0]).name;
  const themes = interests.length ? interests.join(', ') : 'adventure, friendship, discovery';
  const storyFormat = format === 'comic' ? 'comic book' : 'storybook';
  const system = `You are a professional children's book author writing EXCLUSIVELY in ${language}.
Write ALL narrative and dialogue in ${language} only.
${language !== 'English' ? `Do not use English in the story text.` : ''}
Write positive, age-appropriate stories for children aged 4–10 with a coherent beginning, challenge, and resolution.
The hero is "${hero}". Name and feature this hero on EVERY page. Other characters may address the hero by name.
Make these interests central to the adventure and problem-solving: ${themes}.
Keep characters, locations, clothing, and events consistent across scenes.
All scene descriptions must describe ${artStyle} visual elements.
Generate exactly ${pageCount} pages. Each page has a detailed scene description, story text in ${language}, and a panel layout.
Return only a JSON array of pages.`;

  const premise = plotMode === 'manual'
    ? `Use this parent-provided plot as the main storyline: ${JSON.stringify(customPlot)}.`
    : `Weave the hero's interests naturally into the main storyline: ${themes}.`;
  const user = `Create a ${pageCount}-page ${storyFormat}.
Hero: ${hero}
Characters: ${characters.map(c => `${c.name} (${c.role})`).join(', ')}
Language: ${language}
Art style: ${artStyle}
${premise}
Name and feature ${hero} on every page and keep the whole story in ${language}.
Return ONLY an array in this structure:
[{
  "pageNumber": 1,
  "sceneDescription": "Detailed ${artStyle} illustration description featuring ${hero}",
  "dialogueText": "Narrative or dialogue in ${language}",
  "panelLayoutType": "single"
}]
Allowed layouts: single, two-panel, three-panel, action-splash.`;
  return { system, user };
}
