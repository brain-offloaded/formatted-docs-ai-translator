import React from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { ExamplePresetDto } from '../../../../nest/translation/example/dto/example-preset.dto';
import { PromptPresetDto } from '../../../../nest/translation/prompt/dto/prompt-preset.dto';

type Preset = ExamplePresetDto | PromptPresetDto;

interface PresetListProps<T extends Preset> {
  title: string;
  presets: T[];
  selectedPreset: T | null;
  onSelectPreset: (preset: T) => void;
  onDeletePreset: (id: number) => void;
  onClearSelection: () => void;
}

const PresetList = <T extends Preset>({
  title,
  presets,
  selectedPreset,
  onSelectPreset,
  onDeletePreset,
  onClearSelection,
}: PresetListProps<T>) => {
  return (
    <Paper sx={{ flex: 1, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <Button variant="outlined" startIcon={<Add />} onClick={onClearSelection}>
          새 프리셋
        </Button>
      </Box>
      <List>
        {presets.map((preset) => (
          <ListItem
            key={preset.id}
            disablePadding
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => onSelectPreset(preset)}>
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onDeletePreset(preset.id)}
                >
                  <Delete />
                </IconButton>
              </>
            }
          >
            <ListItemButton
              onClick={() => onSelectPreset(preset)}
              selected={selectedPreset?.id === preset.id}
            >
              <ListItemText primary={preset.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default PresetList;
