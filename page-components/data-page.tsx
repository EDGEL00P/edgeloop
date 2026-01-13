'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDataImports, useCreateDataImport, useDeleteDataImport } from '@/lib/api';
import { useSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  FileJson,
  FileSpreadsheet,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Data() {
  const { reduceMotion } = useSettings();
  const { data: imports = [], isLoading } = useDataImports();
  const createImport = useCreateDataImport();
  const deleteImport = useDeleteDataImport();
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleRefresh = async (filename: string) => {
    setRefreshing(filename);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(null);
  };

  const handleUpload = () => {
    createImport.mutate({
      filename: 'new_data_' + Date.now() + '.json',
      rows: Math.floor(Math.random() * 500) + 100,
      columns: ['id', 'value', 'timestamp'],
      status: 'loaded'
    });
  };

  const handleDelete = (id: string) => {
    deleteImport.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data imports...</p>
        </div>
      </div>
    );
  }

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.json')) return FileJson;
    if (filename.endsWith('.csv')) return FileSpreadsheet;
    return Database;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loaded':
        return (
          <Badge variant="outline" className="text-green-400 border-green-400/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Loaded
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-red-400 border-red-400/50">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="font-display text-3xl tracking-wider text-glow-cyan mb-2">
            DATA NEXUS
          </h1>
          <p className="text-muted-foreground text-sm">
            Ingest mock JSON/CSV data and refresh visualizations
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-8 border border-dashed border-primary/50 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-lg tracking-wide mb-2">Upload Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drop JSON or CSV files here, or click to browse
          </p>
          <Button 
            onClick={handleUpload}
            className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90"
            data-testid="upload-data-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Simulate Upload
          </Button>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-neon-cyan" />
              <span className="font-display tracking-wide">Loaded Datasets</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {imports.length} files
            </Badge>
          </div>

          <div className="space-y-3">
            {imports.map((imp, index) => {
              const FileIcon = getFileIcon(imp.filename);
              const lastUpdated = new Date(imp.lastUpdated).toLocaleString();
              
              return (
                <motion.div
                  key={imp.id}
                  initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all"
                  data-testid={`data-file-${imp.filename}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                        <FileIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-mono text-sm mb-1">{imp.filename}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{imp.rows.toLocaleString()} rows</span>
                          <span>•</span>
                          <span>{imp.columns.length} columns</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lastUpdated}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {imp.columns.slice(0, 5).map(col => (
                            <span 
                              key={col}
                              className="px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground"
                            >
                              {col}
                            </span>
                          ))}
                          {imp.columns.length > 5 && (
                            <span className="px-2 py-0.5 rounded-full bg-muted/50 text-xs text-muted-foreground">
                              +{imp.columns.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(imp.status)}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefresh(imp.filename)}
                        disabled={refreshing === imp.filename}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={cn(
                          "w-4 h-4",
                          refreshing === imp.filename && "animate-spin"
                        )} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => alert(`Preview for ${imp.filename}:\n\nRows: ${imp.rows.toLocaleString()}\nColumns: ${imp.columns.join(', ')}\nStatus: ${imp.status}`)}
                        data-testid={`button-view-${imp.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(imp.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 border border-border/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-neon-violet" />
            <span className="font-display tracking-wide">Data Pipeline Status</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-display text-neon-cyan">2.4M</div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-display text-neon-green">98.2%</div>
              <div className="text-xs text-muted-foreground">Data Quality</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-display text-neon-violet">142ms</div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-display text-neon-orange">12</div>
              <div className="text-xs text-muted-foreground">Active Streams</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
