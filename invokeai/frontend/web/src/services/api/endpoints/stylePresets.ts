import type { paths } from 'services/api/schema';
import type { S } from 'services/api/types';

import { api, buildV1Url, LIST_TAG } from '..';

export type StylePresetRecordWithImage =
  paths['/api/v1/style_presets/i/{style_preset_id}']['get']['responses']['200']['content']['application/json'];

export type PresetType = S['PresetType'];

/**
 * Builds an endpoint URL for the style_presets router
 * @example
 * buildStylePresetsUrl('some-path')
 * // '/api/v1/style_presets/some-path'
 */
const buildStylePresetsUrl = (path: string = '') => buildV1Url(`style_presets/${path}`);

export const stylePresetsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStylePreset: build.query<
      paths['/api/v1/style_presets/i/{style_preset_id}']['get']['responses']['200']['content']['application/json'],
      string
    >({
      query: (style_preset_id) => buildStylePresetsUrl(`i/${style_preset_id}`),
      providesTags: (result, error, style_preset_id) => [
        { type: 'StylePreset', id: style_preset_id },
        'FetchOnReconnect',
      ],
    }),
    deleteStylePreset: build.mutation<void, string>({
      query: (style_preset_id) => ({
        url: buildStylePresetsUrl(`i/${style_preset_id}`),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, style_preset_id) => [
        { type: 'StylePreset', id: LIST_TAG },
        { type: 'StylePreset', id: style_preset_id },
      ],
    }),
    createStylePreset: build.mutation<
      paths['/api/v1/style_presets/']['post']['responses']['200']['content']['application/json'],
      { data: { name: string; positive_prompt: string; negative_prompt: string; type: PresetType }; image: Blob | null }
    >({
      query: ({ data, image }) => {
        const formData = new FormData();
        if (image) {
          formData.append('image', image);
        }

        formData.append('data', JSON.stringify(data));

        return {
          url: buildStylePresetsUrl(),
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [
        { type: 'StylePreset', id: LIST_TAG },
        { type: 'StylePreset', id: LIST_TAG },
      ],
    }),
    updateStylePreset: build.mutation<
      paths['/api/v1/style_presets/i/{style_preset_id}']['patch']['responses']['200']['content']['application/json'],
      { data: { name: string; positive_prompt: string; negative_prompt: string }; image: Blob | null; id: string }
    >({
      query: ({ id, data, image }) => {
        const formData = new FormData();
        if (image) {
          formData.append('image', image);
        }
        formData.append('data', JSON.stringify(data));

        return {
          url: buildStylePresetsUrl(`i/${id}`),
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: (response, error, { id }) => [
        { type: 'StylePreset', id: LIST_TAG },
        { type: 'StylePreset', id: id },
      ],
    }),
    listStylePresets: build.query<
      paths['/api/v1/style_presets/']['get']['responses']['200']['content']['application/json'],
      void
    >({
      query: () => ({
        url: buildStylePresetsUrl(),
      }),
      providesTags: ['FetchOnReconnect', { type: 'StylePreset', id: LIST_TAG }],
    }),
    importStylePresets: build.mutation<
      paths['/api/v1/style_presets/import']['post']['responses']['200']['content']['application/json'],
      paths['/api/v1/style_presets/import']['post']['requestBody']['content']['multipart/form-data']['file']
    >({
      query: (file) => {
        const formData = new FormData();

        formData.append('file', file);

        return {
          url: buildStylePresetsUrl('import'),
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'StylePreset', id: LIST_TAG }],
    }),
  }),
});

export const {
  useCreateStylePresetMutation,
  useDeleteStylePresetMutation,
  useUpdateStylePresetMutation,
  useListStylePresetsQuery,
  useImportStylePresetsMutation,
} = stylePresetsApi;