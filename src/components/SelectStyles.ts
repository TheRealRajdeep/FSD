import { StylesConfig } from 'react-select';

export const customSelectStyles: StylesConfig = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#6366F1' : '#D1D5DB',
    boxShadow: state.isFocused ? '0 0 0 1px #6366F1' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#6366F1' : '#9CA3AF',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#EEF2FF',
    borderRadius: '0.25rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#4F46E5',
    fontWeight: 500,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#4F46E5',
    '&:hover': {
      backgroundColor: '#4F46E5',
      color: 'white',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected 
      ? '#6366F1' 
      : state.isFocused 
        ? '#EEF2FF' 
        : 'transparent',
    color: state.isSelected ? 'white' : '#374151',
    '&:active': {
      backgroundColor: '#4F46E5',
    },
  }),
};
