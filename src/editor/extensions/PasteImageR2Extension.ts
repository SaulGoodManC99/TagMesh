import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { uploadImageToR2 } from '../../services/api';

export interface PasteImageR2Options {
  onUploadStart?: () => void;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export const PasteImageR2Extension = Extension.create<PasteImageR2Options>({
  name: 'pasteImageR2',

  addOptions() {
    return {
      onUploadStart: undefined,
      onUploadSuccess: undefined,
      onUploadError: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('pasteImageR2'),
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const items = Array.from(clipboardData.items);
            const imageItem = items.find(item => item.type.startsWith('image/'));
            if (!imageItem) return false;

            const file = imageItem.getAsFile();
            if (!file) return false;

            event.preventDefault();

            // Optimistic insert with temporary blob URL
            const localUrl = URL.createObjectURL(file);
            const { schema, tr } = view.state;
            const node = schema.nodes.image.create({
              src: localUrl,
              alt: 'Uploading to R2...',
              title: 'uploading',
            });

            const transaction = tr.replaceSelectionWith(node);
            view.dispatch(transaction);

            options.onUploadStart?.();

            uploadImageToR2(file)
              .then(({ url }) => {
                const currentDoc = view.state.doc;
                let foundPos = -1;

                currentDoc.descendants((n, pos) => {
                  if (n.type.name === 'image' && n.attrs.src === localUrl) {
                    foundPos = pos;
                    return false;
                  }
                });

                if (foundPos !== -1) {
                  const updateTr = view.state.tr.setNodeMarkup(foundPos, undefined, {
                    src: url,
                    alt: file.name || 'image',
                    title: null,
                  });
                  view.dispatch(updateTr);
                }

                URL.revokeObjectURL(localUrl);
                options.onUploadSuccess?.(url);
              })
              .catch(err => {
                options.onUploadError?.(err);
              });

            return true;
          },

          handleDrop(view, event) {
            const dataTransfer = event.dataTransfer;
            if (!dataTransfer || !dataTransfer.files || dataTransfer.files.length === 0) return false;

            const files = Array.from(dataTransfer.files);
            const imageFile = files.find(f => f.type.startsWith('image/'));
            if (!imageFile) return false;

            event.preventDefault();

            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!coordinates) return false;

            const localUrl = URL.createObjectURL(imageFile);
            const { schema, tr } = view.state;
            const node = schema.nodes.image.create({
              src: localUrl,
              alt: 'Uploading to R2...',
              title: 'uploading',
            });

            const insertPos = coordinates.pos;
            const transaction = tr.insert(insertPos, node);
            view.dispatch(transaction);

            options.onUploadStart?.();

            uploadImageToR2(imageFile)
              .then(({ url }) => {
                const currentDoc = view.state.doc;
                let foundPos = -1;

                currentDoc.descendants((n, pos) => {
                  if (n.type.name === 'image' && n.attrs.src === localUrl) {
                    foundPos = pos;
                    return false;
                  }
                });

                if (foundPos !== -1) {
                  const updateTr = view.state.tr.setNodeMarkup(foundPos, undefined, {
                    src: url,
                    alt: imageFile.name || 'image',
                    title: null,
                  });
                  view.dispatch(updateTr);
                }

                URL.revokeObjectURL(localUrl);
                options.onUploadSuccess?.(url);
              })
              .catch(err => {
                options.onUploadError?.(err);
              });

            return true;
          },
        },
      }),
    ];
  },
});
