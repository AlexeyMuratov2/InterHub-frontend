/**
 * Универсальная область загрузки файлов: drop zone, список файлов с удалением и опциональной кнопкой «Скачать».
 * Поддерживает один или несколько файлов.
 */
import { useRef, useState } from 'react';
import { formatFileSize } from '../../lib/fileUtils';
import { Upload, Trash2, Download } from 'lucide-react';

export interface FileUploadItem {
  file: File;
  uploaded?: { id: string; originalName?: string; size?: number };
  uploading?: boolean;
  error?: string;
}

export interface FileUploadAreaProps {
  /** Текущий список файлов (локальные + опционально загруженные) */
  items: FileUploadItem[];
  /** Добавить файлы (вызов при выборе или drop) */
  onAdd: (files: File[]) => void;
  /** Удалить файл по индексу */
  onRemove: (index: number) => void;
  /** Скачать по ID загруженного файла (если передан, показывается кнопка для загруженных) */
  onDownload?: (fileId: string) => void;
  /** Заблокировать ввод и кнопки */
  disabled?: boolean;
  /** Атрибут accept для input */
  accept?: string;
  /** Разрешить выбор нескольких файлов */
  multiple?: boolean;
  /** Подпись над областью */
  label?: string;
  /** Текст внутри drop zone */
  dropZoneText?: string;
  /** Текст кнопки «Добавить файлы» */
  buttonText?: string;
  /** id для input (для связи с FormGroup htmlFor) */
  inputId?: string;
  /** Ключ перевода для «Скачать» (title кнопки) */
  downloadTitle?: string;
  /** Ключ перевода для «Удалить» (title кнопки) */
  deleteTitle?: string;
  /** Ключ перевода для «Загрузка…» */
  uploadingText?: string;
}

export function FileUploadArea({
  items,
  onAdd,
  onRemove,
  onDownload,
  disabled = false,
  accept,
  multiple = true,
  label,
  dropZoneText,
  buttonText,
  inputId = 'file-upload-input',
  downloadTitle = 'Download',
  deleteTitle = 'Delete',
  uploadingText = 'Uploading…',
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onAdd(files);
    }
    e.target.value = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onAdd(multiple ? files : files.slice(0, 1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(true);
  };

  const handleDragLeave = () => {
    setDropZoneActive(false);
  };

  return (
    <>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        aria-hidden
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '1.5rem',
          border: `2px dashed ${dropZoneActive ? '#345FE7' : '#d1d5db'}`,
          borderRadius: '8px',
          backgroundColor: dropZoneActive ? '#f0f4ff' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '120px',
          marginBottom: '0.75rem',
        }}
      >
        <Upload style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} aria-hidden />
        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          {dropZoneText}
        </span>
      </div>
      {buttonText && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="btn-secondary"
          style={{ marginBottom: '1rem' }}
        >
          <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          {buttonText}
        </button>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                  {item.uploaded?.originalName ?? item.file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {formatFileSize(item.uploaded?.size ?? item.file.size)}
                  {item.uploading && ` • ${uploadingText}`}
                  {item.error && ` • ${item.error}`}
                </div>
              </div>
              {item.uploaded && onDownload && (
                <button
                  type="button"
                  onClick={() => onDownload(item.uploaded!.id)}
                  className="btn-secondary"
                  style={{ padding: '0.25rem 0.5rem' }}
                  title={downloadTitle}
                  disabled={disabled}
                >
                  <Download style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled || item.uploading}
                className="btn-secondary"
                style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                title={deleteTitle}
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
