import { useState, useCallback, useEffect } from 'react';
import { MLPipelineStage, MLPipelineConfig, PipelineConfig } from '../types';
import { useUIStore } from '../store/uiStore';
import { usePipelineStore } from '../store/pipelineStore';
import backendAPI from '../services/BackendAPI';
import webSocketManager from '../services/WebSocketManager';

interface MLPipelineState {
  mlPipelineStages: MLPipelineStage[];
  currentMLPipeline: MLPipelineConfig | null;
  selectedStage: MLPipelineStage | null;
  showStageDetail: boolean;
  isInitialized: boolean;
}

interface MLPipelineActions {
  initializeMLPipeline: () => void;
  runMLPipeline: (projectConfig: PipelineConfig, backendConnected: boolean) => Promise<void>;
  updateMLPipelineStage: (stageId: string, update: Partial<MLPipelineStage> | ((stage: MLPipelineStage) => Partial<MLPipelineStage>)) => void;
  handleStageClick: (stageId: string) => void;
  setShowStageDetail: (show: boolean) => void;
  setupWebSocketListeners: () => void;
  resetMLPipeline: () => void;
}

export const useMLPipeline = (): MLPipelineState & MLPipelineActions => {
  const [mlPipelineStages, setMLPipelineStages] = useState<MLPipelineStage[]>([]);
  const [currentMLPipeline, setCurrentMLPipelineLocal] = useState<MLPipelineConfig | null>(null);
  const [selectedStage, setSelectedStage] = useState<MLPipelineStage | null>(null);
  const [showStageDetail, setShowStageDetail] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const { addTerminalMessage, togglePanel } = useUIStore();
  const { 
    setError, 
    setCurrentMLPipeline, 
    startPipeline,
    stopPipeline,
    updateProgress,
    addLog 
  } = usePipelineStore();

  const initializeMLPipeline = useCallback(() => {
    const defaultStages: MLPipelineStage[] = [
      {
        id: 'data_ingestion',
        name: 'Data Ingestion',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'preprocessing',
        name: 'Data Preprocessing', 
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'model_training',
        name: 'Model Training',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'evaluation',
        name: 'Model Evaluation',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      },
      {
        id: 'deployment',
        name: 'Model Deployment',
        status: 'idle',
        logs: [],
        outputs: {},
        artifacts: []
      }
    ];
    setMLPipelineStages(defaultStages);
    setIsInitialized(true);
  }, []);

  const setupWebSocketListeners = useCallback(() => {
    if (!webSocketManager.isSocketConnected()) {
      return;
    }

    webSocketManager.onStageStart((event) => {
      addTerminalMessage(`🚀 Stage started: ${event.data.stage}`);
      updateMLPipelineStage(event.stageId!, { status: 'running', startTime: new Date() });
    });

    webSocketManager.onStageComplete((event) => {
      addTerminalMessage(`✅ Stage completed: ${event.data.stage}`);
      updateMLPipelineStage(event.stageId!, { 
        status: 'completed', 
        endTime: new Date(),
        outputs: event.data.outputs || {}
      });
    });

    webSocketManager.onStageError((event) => {
      addTerminalMessage(`❌ Stage failed: ${event.data.error}`);
      updateMLPipelineStage(event.stageId!, { status: 'error', endTime: new Date() });
    });

    webSocketManager.onPipelineComplete((event) => {
      addTerminalMessage('🎉 ML Pipeline completed successfully!');
      stopPipeline();
    });

    webSocketManager.onLog((log) => {
      const logMessage = `[${log.stage || 'SYSTEM'}] ${log.message}`;
      addTerminalMessage(logMessage);
      addLog(log.message);
      
      // Add log to the specific stage
      if (log.stage) {
        updateMLPipelineStage(log.stage, (stage) => ({
          logs: [...stage.logs, log.message]
        }));
      }
    });
  }, [addTerminalMessage, stopPipeline, addLog]);

  const updateMLPipelineStage = useCallback((
    stageId: string, 
    update: Partial<MLPipelineStage> | ((stage: MLPipelineStage) => Partial<MLPipelineStage>)
  ) => {
    setMLPipelineStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updateData = typeof update === 'function' ? update(stage) : update;
        return { ...stage, ...updateData };
      }
      return stage;
    }));
  }, []);

  const runMLPipeline = useCallback(async (projectConfig: PipelineConfig, backendConnected: boolean) => {
    if (!backendConnected) {
      addTerminalMessage('❌ Backend connection required for ML Pipeline execution');
      addTerminalMessage('💡 Please ensure the backend server is running');
      return;
    }

    if (!projectConfig) {
      addTerminalMessage('❌ No project configured for ML Pipeline');
      togglePanel('showProjectInput');
      return;
    }

    addTerminalMessage('🚀 Starting ML Pipeline execution...');
    addTerminalMessage(`🎯 Project: ${projectConfig.projectName}`);

    try {
      // Create ML pipeline configuration
      const mlConfig: Partial<MLPipelineConfig> = {
        name: `${projectConfig.projectName} ML Pipeline`,
        description: projectConfig.description,
        dataPath: './data/sample_data.csv',
        outputPath: `./outputs/${Date.now()}`
      };

      // Create pipeline through backend
      const pipeline = await backendAPI.createPipeline(mlConfig);
      setCurrentMLPipelineLocal(pipeline);
      setCurrentMLPipeline(pipeline);
      addTerminalMessage(`📋 ML Pipeline created: ${pipeline.id}`);

      // Start pipeline in store
      startPipeline(pipeline);

      // Setup WebSocket for real-time updates
      if (webSocketManager.isSocketConnected()) {
        webSocketManager.emit('join-pipeline', { pipelineId: pipeline.id });
      }

      // Execute the pipeline
      const executionId = await backendAPI.executePipeline(pipeline.id, pipeline);
      addTerminalMessage(`🔄 Execution started: ${executionId}`);

      // Reset all stages to running status
      setMLPipelineStages(prev => prev.map(stage => ({
        ...stage,
        status: 'idle'
      })));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      addTerminalMessage(`❌ ML Pipeline failed: ${errorMessage}`);
      stopPipeline();
    }
  }, [addTerminalMessage, togglePanel, setCurrentMLPipeline, startPipeline, stopPipeline, setError]);

  const handleStageClick = useCallback((stageId: string) => {
    const stage = mlPipelineStages.find(s => s.id === stageId);
    if (stage) {
      setSelectedStage(stage);
      setShowStageDetail(true);
    }
  }, [mlPipelineStages]);

  const resetMLPipeline = useCallback(() => {
    setMLPipelineStages([]);
    setCurrentMLPipelineLocal(null);
    setSelectedStage(null);
    setShowStageDetail(false);
    setIsInitialized(false);
    stopPipeline();
  }, [stopPipeline]);

  // Initialize ML pipeline on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeMLPipeline();
    }
  }, [isInitialized, initializeMLPipeline]);

  // Setup WebSocket listeners when component mounts or WebSocket connects
  useEffect(() => {
    setupWebSocketListeners();
    
    // Cleanup function to remove listeners
    return () => {
      if (webSocketManager.isSocketConnected()) {
        webSocketManager.off('stage:start');
        webSocketManager.off('stage:complete');
        webSocketManager.off('stage:error');
        webSocketManager.off('pipeline:complete');
        webSocketManager.off('log');
      }
    };
  }, [setupWebSocketListeners]);

  return {
    // State
    mlPipelineStages,
    currentMLPipeline,
    selectedStage,
    showStageDetail,
    isInitialized,
    
    // Actions
    initializeMLPipeline,
    runMLPipeline,
    updateMLPipelineStage,
    handleStageClick,
    setShowStageDetail,
    setupWebSocketListeners,
    resetMLPipeline
  };
};