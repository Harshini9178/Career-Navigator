import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  Upload,
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  CARTOON_AVATARS,
  CartoonAvatar,
  DEFAULT_CARTOON_AVATAR,
  getAvatarSrc
} from '../lib/avatars.js';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  currentAvatar?: string;
  onClose: () => void;
  onSaveAvatar: (newAvatarDataUriOrUrl: string) => Promise<void> | void;
}

type TabType = 'presets' | 'upload' | 'url';
type CategoryFilter = 'All' | 'Student' | 'Developer' | 'Professional' | 'Creative';

export default function AvatarSelectionModal({
  isOpen,
  currentAvatar,
  onClose,
  onSaveAvatar
}: AvatarSelectionModalProps) {
  const initialAvatar = getAvatarSrc(currentAvatar);
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [stagedAvatar, setStagedAvatar] = useState<string>(initialAvatar);
  const [selectedAvatarInfo, setSelectedAvatarInfo] = useState<{
    name: string;
    role: string;
    category: string;
    source: 'preset' | 'upload' | 'url';
  }>(() => {
    const matchingPreset = CARTOON_AVATARS.find((a) => a.dataUri === initialAvatar);
    if (matchingPreset) {
      return {
        name: matchingPreset.name,
        role: matchingPreset.role,
        category: matchingPreset.category,
        source: 'preset'
      };
    }
    return {
      name: 'Custom Profile Picture',
      role: 'Active Profile',
      category: 'Custom',
      source: initialAvatar.startsWith('data:') ? 'upload' : 'url'
    };
  });

  // Custom Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Custom URL state
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [testingUrl, setTestingUrl] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen) {
      const cur = getAvatarSrc(currentAvatar);
      setStagedAvatar(cur);
      const match = CARTOON_AVATARS.find((a) => a.dataUri === cur);
      if (match) {
        setSelectedAvatarInfo({
          name: match.name,
          role: match.role,
          category: match.category,
          source: 'preset'
        });
      } else {
        setSelectedAvatarInfo({
          name: 'Custom Profile Picture',
          role: 'Active Profile',
          category: 'Custom',
          source: cur.startsWith('data:') ? 'upload' : 'url'
        });
      }
      setUploadError(null);
      setUrlError(null);
      setCustomUrlInput('');
      setActiveTab('presets');
      setSelectedCategory('All');
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  // Filter cartoon avatars by category
  const filteredAvatars =
    selectedCategory === 'All'
      ? CARTOON_AVATARS
      : CARTOON_AVATARS.filter((a) => a.category === selectedCategory);

  // Handle preset selection
  const handleSelectPreset = (avatar: CartoonAvatar) => {
    setStagedAvatar(avatar.dataUri);
    setSelectedAvatarInfo({
      name: avatar.name,
      role: avatar.role,
      category: avatar.category,
      source: 'preset'
    });
    setUploadError(null);
    setUrlError(null);
  };

  // Validate and process uploaded image
  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate mime-type
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = /\.(png|jpe?g)$/i;
    if (!validMimeTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setUploadError('Invalid file type. Please select a PNG, JPG, or JPEG image file.');
      return;
    }

    // Validate size (max 2 MB = 2 * 1024 * 1024 bytes)
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`File size exceeds 2 MB limit (selected file is ${fileSizeMb} MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        setStagedAvatar(base64Data);
        setSelectedAvatarInfo({
          name: file.name.replace(/\.[^/.]+$/, ''),
          role: 'Uploaded from computer',
          category: 'Custom Upload',
          source: 'upload'
        });
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file from disk. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Validate and test custom URL
  const handleApplyCustomUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUrlError(null);

    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter an image URL.');
      return;
    }

    // Must be valid HTTPS URL by default
    if (!/^https:\/\//i.test(trimmed)) {
      setUrlError('Security requirement: Please provide a secure HTTPS image URL (starting with https://).');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setUrlError('Invalid URL format. Please provide a complete, valid URL.');
      return;
    }

    setTestingUrl(true);

    // Test load image in memory with graceful timeout
    const testImg = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        setTestingUrl(false);
        setUrlError('Image load timed out. Please check the URL or try an alternative image.');
      }
    }, 6000);

    testImg.onload = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      setTestingUrl(false);
      setStagedAvatar(trimmed);
      setSelectedAvatarInfo({
        name: 'Custom Web Avatar',
        role: 'Verified HTTPS Image',
        category: 'Custom URL',
        source: 'url'
      });
    };

    testImg.onerror = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      setTestingUrl(false);
      setUrlError('Unable to load image from this URL. Please verify the URL points to a publicly accessible image file.');
    };

    testImg.src = trimmed;
  };

  // Save the staged avatar
  const handleConfirmSave = async () => {
    if (!stagedAvatar) return;
    setIsSaving(true);
    try {
      await onSaveAvatar(stagedAvatar);
      onClose();
    } catch (err: any) {
      console.error('Failed to save avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel without saving changes
  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={handleCancel}
    >
      <div
        className="glass-card w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2
                id="avatar-modal-title"
                className="text-base sm:text-lg font-bold font-heading text-slate-100 tracking-tight"
              >
                Choose Your Profile Avatar
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 pl-10.5">
              Select an attractive cartoon avatar or upload your own photo for your Career Navigator profile.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close avatar modal"
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card & Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
          {/* Active Preview Banner */}
          <div className="md:col-span-12 p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={stagedAvatar}
                alt="Selected Avatar Preview"
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 border-cyan-400/80 object-cover bg-slate-900 shadow-md shadow-cyan-950/50"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {selectedAvatarInfo.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                  {selectedAvatarInfo.category}
                </span>
                {stagedAvatar === initialAvatar && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                    Current Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {selectedAvatarInfo.role}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Previewing selection. Click &ldquo;Save Avatar&rdquo; below to update your profile across the application.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs: Cartoon Avatars / Upload / URL */}
        <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cartoon Avatars ({CARTOON_AVATARS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Custom URL</span>
          </button>
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: Cartoon Avatars Gallery */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['All', 'Student', 'Developer', 'Professional', 'Creative'] as CategoryFilter[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* Grid of Cartoon Avatars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
                {filteredAvatars.map((av) => {
                  const isChosen = stagedAvatar === av.dataUri;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => handleSelectPreset(av)}
                      aria-label={`Select avatar: ${av.name}, ${av.role}`}
                      aria-pressed={isChosen}
                      tabIndex={0}
                      className={`group relative p-2.5 rounded-2xl border text-left transition-all duration-150 flex flex-col items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        isChosen
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-800/40 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Checkmark Badge for Selected Avatar */}
                      {isChosen && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Avatar Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 bg-slate-900 border border-slate-700/60 group-hover:border-slate-500 transition">
                        <img
                          src={av.dataUri}
                          alt={av.name}
                          className="w-full h-full object-cover rounded-full"
                          loading="lazy"
                        />
                      </div>

                      {/* Info & Accessible Label */}
                      <div className="mt-2 text-center w-full min-w-0">
                        <span className="block text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300 transition">
                          {av.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                          {av.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Upload Image */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleFileInputChange}
                className="hidden"
                id="avatar-file-upload-input"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-800 hover:border-cyan-500/50 bg-slate-950/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Click to browse or drag and drop an image
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, or JPEG format (Maximum file size: 2 MB)
                  </p>
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Validation Error</span>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Upload Guidelines */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">File Upload Requirements:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Accepted formats: PNG, JPG, JPEG</li>
                  <li>Maximum file size: 2 MB</li>
                  <li>The image is processed locally and safely synced to your account</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Custom Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <form onSubmit={handleApplyCustomUrl} className="space-y-3">
                <label
                  htmlFor="custom-url-input"
                  className="text-xs font-semibold text-slate-300 block"
                >
                  Direct HTTPS Image Link
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-url-input"
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://example.com/my-profile-avatar.png"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={testingUrl || !customUrlInput.trim()}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {testingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* URL Error Banner */}
              {urlError && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Validation Error</span>
                    <span>{urlError}</span>
                  </div>
                </div>
              )}

              {/* Security Hint */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Security & Privacy Notice:</p>
                <p>
                  To protect your session and avoid mixed-content issues, only secure HTTPS image links are supported. The URL is verified before saving to prevent broken avatars.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Save Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
