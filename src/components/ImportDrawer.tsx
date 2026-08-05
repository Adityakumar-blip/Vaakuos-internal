import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ArrowUpTrayIcon as Upload,
  TableCellsIcon as FileSpreadsheet,
  ArrowDownTrayIcon as Download,
  ArrowRightIcon as ArrowRight,
  CheckIcon as Check,
  ExclamationCircleIcon as AlertCircle,
  XMarkIcon as X,
  DocumentTextIcon as FileText,
  LinkIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLazyDownloadSampleImportFileQuery, useImportContactsMutation } from "@/store/api/contactsApi";
import {
  useGetGoogleSheetsStatusQuery,
  useGetGoogleSheetsSpreadsheetsQuery,
  useLazyGetGoogleSheetsTabsQuery,
  useLazyGetGoogleSheetsPreviewQuery,
  useImportContactsFromGoogleSheetMutation,
} from "@/store/api/integrationsApi";

interface ImportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  sampleFileUrl?: string;
  importUrl?: string;
  onImportSuccess?: () => void;
}

const SYSTEM_FIELDS = [
  { label: "Name", value: "name", required: true },
  { label: "Phone", value: "phone", required: false },
  { label: "Email", value: "email", required: false },
  { label: "Tags", value: "tags", required: false },
  { label: "Status", value: "status", required: false },
];

type ImportSource = "file" | "sheets";
type Step = "upload" | "select-sheet" | "mapping" | "uploading" | "success";

export function ImportDrawer({
  open,
  onOpenChange,
  title = "Import Contacts",
  description = "Upload a file or import directly from Google Sheets.",
  sampleFileUrl = "/contacts/import/sample",
  importUrl = "/import",
  onImportSuccess
}: ImportDrawerProps) {
  const navigate = useNavigate();
  const [triggerDownloadSample, { isLoading: isDownloading }] = useLazyDownloadSampleImportFileQuery();
  const [importContacts, { isLoading: isImporting }] = useImportContactsMutation();

  // Google Sheets hooks
  const { data: sheetsStatus, isLoading: isStatusLoading } = useGetGoogleSheetsStatusQuery(undefined, {
    skip: !open,
  });
  const isSheetsConnected = !!sheetsStatus?.connected;
  const { data: spreadsheets = [], isFetching: isLoadingSpreadsheets } = useGetGoogleSheetsSpreadsheetsQuery(undefined, {
    skip: !open || !isSheetsConnected,
  });
  const [fetchTabs, { data: tabs = [], isFetching: isLoadingTabs }] = useLazyGetGoogleSheetsTabsQuery();
  const [fetchPreview, { isFetching: isLoadingPreview }] = useLazyGetGoogleSheetsPreviewQuery();
  const [importFromSheet] = useImportContactsFromGoogleSheetMutation();

  const [source, setSource] = useState<ImportSource>("file");
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Google Sheets selection state
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [tab, setTab] = useState<string>("");
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number; failed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSource("file");
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setMapping({});
    setError(null);
    setSpreadsheetId("");
    setTab("");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const switchSource = (next: ImportSource) => {
    setError(null);
    setHeaders([]);
    setMapping({});
    setFile(null);
    setSpreadsheetId("");
    setTab("");
    setSource(next);
    setStep(next === "sheets" ? "select-sheet" : "upload");
  };

  // Auto-map headers to system fields by name.
  const autoMap = (extractedHeaders: string[]) => {
    const newMapping: Record<string, string> = {};
    extractedHeaders.forEach(header => {
      const normalizedHeader = header.toLowerCase();
      const match = SYSTEM_FIELDS.find(
        f => f.value === normalizedHeader || f.label.toLowerCase() === normalizedHeader
      );
      if (match) newMapping[header] = match.value;
    });
    setMapping(newMapping);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Basic CSV parsing to get headers
    if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const firstLine = text.split('\n')[0];
          const extractedHeaders = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          setHeaders(extractedHeaders);
          autoMap(extractedHeaders);
          setStep('mapping');
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setHeaders([]);
      setStep('mapping');
      setError("Field mapping is currently only available for CSV files. Excel files will be uploaded directly.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleMappingChange = (header: string, systemField: string) => {
    setMapping(prev => ({
      ...prev,
      [header]: systemField
    }));
  };

  // ----- Google Sheets flow -----
  const handleSpreadsheetChange = async (id: string) => {
    setSpreadsheetId(id);
    setTab("");
    setHeaders([]);
    setMapping({});
    setError(null);
    try {
      await fetchTabs(id).unwrap();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to load sheet tabs.");
    }
  };

  const handleTabChange = async (selectedTab: string) => {
    setTab(selectedTab);
    setError(null);
    try {
      const preview = await fetchPreview({ spreadsheetId, tab: selectedTab }).unwrap();
      if (!preview.headers?.length) {
        setError("This sheet has no columns to map. Make sure the first row contains headers.");
        return;
      }
      setHeaders(preview.headers);
      autoMap(preview.headers);
      setStep("mapping");
    } catch (err: any) {
      setError(err?.data?.message || "Failed to read the selected sheet.");
    }
  };

  // Build the columnMapping payload, dropping ignored columns.
  const buildColumnMapping = (): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(mapping).forEach(([header, value]) => {
      if (value && value !== "ignore") {
        result[header] = value;
      }
    });
    return result;
  };

  const handleImport = async () => {
    setStep('uploading');
    setError(null);

    try {
      if (source === "sheets") {
        const result = await importFromSheet({
          spreadsheetId,
          body: {
            tab,
            columnMapping: buildColumnMapping(),
            skipDuplicates: true,
            updateExisting: false,
          },
        }).unwrap();
        setImportResult(result);
        setStep('success');
        if (onImportSuccess) onImportSuccess();
        return;
      }

      // File upload path
      if (!file) {
        setError("No file selected.");
        setStep("mapping");
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(buildColumnMapping()));
      await importContacts(formData).unwrap();

      setStep('success');
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err?.data?.message || 'Failed to import. Please try again.');
      setStep(source === "sheets" ? "mapping" : "mapping");
    }
  };

  const handleDownloadSample = async () => {
    try {
      const result = await triggerDownloadSample();

      if ('data' in result && result.data) {
        const blob = result.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'contacts_sample.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to download sample file. Please try again.');
      }
    } catch (err) {
      console.error('Error downloading sample file:', err);
      setError('Failed to download sample file. Please try again.');
    }
  };

  const showSourceTabs = step === "upload" || step === "select-sheet";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full" side="right">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 overflow-y-auto">
          {/* Source switcher */}
          {showSourceTabs && (
            <div className="grid grid-cols-2 gap-2 p-1 mb-6 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => switchSource("file")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  source === "file" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => switchSource("sheets")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  source === "sheets" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Google Sheets
              </button>
            </div>
          )}

          {/* FILE UPLOAD STEP */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">CSV or Excel (max 10MB)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Need a template?</p>
                    <p className="text-xs text-muted-foreground">Download our sample file</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadSample} disabled={isDownloading}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* GOOGLE SHEETS SELECT STEP */}
          {step === 'select-sheet' && (
            <div className="space-y-6">
              {isStatusLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : !isSheetsConnected ? (
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <LinkIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Google Sheets isn't connected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect your Google account to import contacts directly from a spreadsheet.
                    </p>
                  </div>
                  <Button onClick={() => { handleOpenChange(false); navigate("/integrations"); }}>
                    Connect Google Sheets
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Spreadsheet</Label>
                    <Select value={spreadsheetId} onValueChange={handleSpreadsheetChange} disabled={isLoadingSpreadsheets}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSpreadsheets ? "Loading spreadsheets..." : "Select a spreadsheet"} />
                      </SelectTrigger>
                      <SelectContent>
                        {spreadsheets.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isLoadingSpreadsheets && spreadsheets.length === 0 && (
                      <p className="text-xs text-muted-foreground">No spreadsheets found in your Google account.</p>
                    )}
                  </div>

                  {spreadsheetId && (
                    <div className="space-y-2">
                      <Label>Sheet / Tab</Label>
                      <Select value={tab} onValueChange={handleTabChange} disabled={isLoadingTabs || isLoadingPreview}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingTabs ? "Loading tabs..." : "Select a tab"} />
                        </SelectTrigger>
                        <SelectContent>
                          {tabs.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isLoadingPreview && (
                    <p className="text-xs text-muted-foreground">Reading sheet…</p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* MAPPING STEP (shared by file + sheets) */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {source === "sheets"
                        ? `${spreadsheets.find(s => s.id === spreadsheetId)?.name ?? "Sheet"} · ${tab}`
                        : file?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {source === "sheets" ? "Google Sheets" : `${(file?.size ? (file.size / 1024).toFixed(2) : 0)} KB`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => switchSource(source)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {headers.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Map Fields</h3>
                    <span className="text-xs text-muted-foreground">Match columns to system fields</span>
                  </div>

                  <div className="space-y-3">
                    {headers.map((header, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 items-center">
                        <div className="text-sm font-medium truncate" title={header}>
                          {header}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto hidden sm:block" />
                        <Select
                          value={mapping[header] || ""}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Ignore" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignore</SelectItem>
                            {SYSTEM_FIELDS.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label} {field.required && "*"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {error || "No headers found or file type not supported for mapping preview."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    The file will be uploaded directly.
                  </p>
                </div>
              )}

              {error && headers.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* UPLOADING STEP */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-muted-foreground/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="font-medium">Importing contacts...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your data.</p>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Import Successful!</h3>
              {importResult ? (
                <p className="text-muted-foreground">
                  {importResult.imported} added
                  {importResult.updated ? `, ${importResult.updated} updated` : ""}
                  {importResult.skipped ? `, ${importResult.skipped} skipped` : ""}
                  {importResult.failed ? `, ${importResult.failed} failed` : ""}.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Your contacts have been successfully queued for import. They will appear in your list shortly.
                </p>
              )}
              <Button onClick={() => handleOpenChange(false)} className="mt-4">
                Done
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 border-t">
          {(step === 'upload' || step === 'select-sheet') && (
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
          )}

          {step === 'mapping' && (
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => switchSource(source)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleImport} disabled={isImporting}>
                Import Contacts
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
