"use client";

import * as Dialog from "@radix-ui/react-dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string | null;
  title: string;
}

export default function VideoModal({ isOpen, onClose, youtubeId, title }: Props) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-midnight/90 z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-carbon rounded-2xl border border-steel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-steel">
              <Dialog.Title className="font-body text-sm text-chrome font-medium truncate pr-4">
                {title}
              </Dialog.Title>
              <Dialog.Close
                onClick={onClose}
                className="text-chrome/40 hover:text-chrome transition-colors flex-shrink-0 text-xl leading-none"
              >
                ✕
              </Dialog.Close>
            </div>

            {youtubeId ? (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <span className="text-4xl">🎬</span>
                <p className="font-display text-2xl text-chrome">Coming Soon</p>
                <p className="font-body text-xs text-chrome/40">
                  Video guide is being produced
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
