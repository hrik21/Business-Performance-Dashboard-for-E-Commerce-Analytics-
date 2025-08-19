/**
 * Data Quality Monitoring and Alerting Service
 */

import { EventEmitter } from 'events';
import { StreamMessage, ProcessingResult } from './stream-processor.service';

export interface DataQualityMetric {
  name: string;
  value: number;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export interface DataQualityAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface DataQualityReport {
  timestamp: Date;
  overallScore: number;
  metrics: DataQualityMetric[];
  alerts: DataQualityAlert[];
  trends: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    validity: number;
  };
  recommendations: string[];
}

export interface QualityRule {
  id: string;
  name: string;
  type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness' | 'validity' | 'uniqueness';
  field?: string;
  condition: any;
  severity: 'warning' | 'critical';
  description: string;
}

export class DataQualityMonitorService extends EventEmitter {
  private metrics: Map<string, DataQualityMetric> = new Map();
  private alerts: Map<string, DataQualityAlert> = new Map();
  private qualityRules: Map<string, QualityRule> = new Map();
  private messageBuffer: StreamMessage[] = [];
  private processingResults: ProcessingResult[] = [];
  private bufferSize: number = 1000;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  /**
   * Add a quality rule
   */
  addQualityRule(rule: QualityRule): void {
    this.qualityRules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }

  /**
   * Remove a quality rule
   */
  removeQualityRule(ruleId: string): boolean {
    const removed = this.qualityRules.delete(ruleId);
    if (removed) {
      this.emit('ruleRemoved', ruleId);
    }
    return removed;
  }

  /**
   * Process a stream message for quality monitoring
   */
  processMessage(message: StreamMessage, result?: ProcessingResult): void {
    // Add to buffer
    this.messageBuffer.push(message);
    
    if (result) {
      this.processingResults.push(result);
    }

    // Maintain buffer size
    if (this.messageBuffer.length > this.bufferSize) {
      this.messageBuffer.shift();
    }

    if (this.processingResults.length > this.bufferSize) {
      this.processingResults.shift();
    }

    // Check quality rules immediately for critical issues
    this.checkQualityRules([message]);
  }

  /**
   * Get current data quality metrics
   */
  getMetrics(): DataQualityMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): DataQualityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): DataQualityAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      alert.acknowledged = true;
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Generate comprehensive data quality report
   */
  generateReport(): DataQualityReport {
    const metrics = this.getMetrics();
    const alerts = this.getAllAlerts();
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(metrics);
    
    // Calculate trends
    const trends = this.calculateTrends();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, alerts);

    return {
      timestamp: new Date(),
      overallScore,
      metrics,
      alerts,
      trends,
      recommendations,
    };
  }

  /**
   * Start monitoring process
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Stop monitoring process
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Update quality metrics based on current data
   */
  private updateMetrics(): void {
    if (this.messageBuffer.length === 0) {
      return;
    }

    // Completeness metric
    this.updateCompletenessMetric();
    
    // Accuracy metric
    this.updateAccuracyMetric();
    
    // Consistency metric
    this.updateConsistencyMetric();
    
    // Timeliness metric
    this.updateTimelinessMetric();
    
    // Validity metric
    this.updateValidityMetric();
    
    // Uniqueness metric
    this.updateUniquenessMetric();

    this.emit('metricsUpdated', this.getMetrics());
  }

  private updateCompletenessMetric(): void {
    const messages = this.messageBuffer;
    let totalFields = 0;
    let completeFields = 0;

    messages.forEach(message => {
      const data = message.value;
      if (typeof data === 'object' && data !== null) {
        Object.values(data).forEach(value => {
          totalFields++;
          if (value !== null && value !== undefined && value !== '') {
            completeFields++;
          }
        });
      }
    });

    const completeness = totalFields > 0 ? (completeFields / totalFields) * 100 : 100;
    
    this.updateMetric('completeness', completeness, {
      warning: 90,
      critical: 80,
    });
  }

  private updateAccuracyMetric(): void {
    const successfulResults = this.processingResults.filter(r => r.success);
    const totalResults = this.processingResults.length;
    
    const accuracy = totalResults > 0 ? (successfulResults.length / totalResults) * 100 : 100;
    
    this.updateMetric('accuracy', accuracy, {
      warning: 95,
      critical: 90,
    });
  }

  private updateConsistencyMetric(): void {
    // Check for data type consistency across messages
    const fieldTypes: Map<string, Set<string>> = new Map();
    
    this.messageBuffer.forEach(message => {
      const data = message.value;
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([field, value]) => {
          if (!fieldTypes.has(field)) {
            fieldTypes.set(field, new Set());
          }
          fieldTypes.get(field)!.add(typeof value);
        });
      }
    });

    let consistentFields = 0;
    let totalFields = fieldTypes.size;

    fieldTypes.forEach(types => {
      if (types.size === 1) {
        consistentFields++;
      }
    });

    const consistency = totalFields > 0 ? (consistentFields / totalFields) * 100 : 100;
    
    this.updateMetric('consistency', consistency, {
      warning: 95,
      critical: 85,
    });
  }

  private updateTimelinessMetric(): void {
    const now = new Date();
    let timelyMessages = 0;
    const threshold = 5 * 60 * 1000; // 5 minutes

    this.messageBuffer.forEach(message => {
      if (message.timestamp) {
        const age = now.getTime() - message.timestamp.getTime();
        if (age <= threshold) {
          timelyMessages++;
        }
      }
    });

    const timeliness = this.messageBuffer.length > 0 ? 
      (timelyMessages / this.messageBuffer.length) * 100 : 100;
    
    this.updateMetric('timeliness', timeliness, {
      warning: 90,
      critical: 80,
    });
  }

  private updateValidityMetric(): void {
    let validMessages = 0;

    this.messageBuffer.forEach(message => {
      if (this.isValidMessage(message)) {
        validMessages++;
      }
    });

    const validity = this.messageBuffer.length > 0 ? 
      (validMessages / this.messageBuffer.length) * 100 : 100;
    
    this.updateMetric('validity', validity, {
      warning: 95,
      critical: 90,
    });
  }

  private updateUniquenessMetric(): void {
    const keys = new Set();
    let duplicates = 0;

    this.messageBuffer.forEach(message => {
      const key = message.key || JSON.stringify(message.value);
      if (keys.has(key)) {
        duplicates++;
      } else {
        keys.add(key);
      }
    });

    const uniqueness = this.messageBuffer.length > 0 ? 
      ((this.messageBuffer.length - duplicates) / this.messageBuffer.length) * 100 : 100;
    
    this.updateMetric('uniqueness', uniqueness, {
      warning: 95,
      critical: 90,
    });
  }

  private updateMetric(name: string, value: number, threshold: { warning: number; critical: number }): void {
    const existingMetric = this.metrics.get(name);
    const trend = existingMetric ? this.calculateTrend(existingMetric.value, value) : 'stable';

    const metric: DataQualityMetric = {
      name,
      value,
      threshold,
      trend,
      lastUpdated: new Date(),
    };

    this.metrics.set(name, metric);
  }

  private calculateTrend(oldValue: number, newValue: number): 'up' | 'down' | 'stable' {
    const threshold = 1; // 1% change threshold
    const change = ((newValue - oldValue) / oldValue) * 100;
    
    if (Math.abs(change) < threshold) {
      return 'stable';
    }
    
    return change > 0 ? 'up' : 'down';
  }

  private checkQualityRules(messages: StreamMessage[]): void {
    this.qualityRules.forEach(rule => {
      messages.forEach(message => {
        const violation = this.checkRule(message, rule);
        if (violation) {
          this.createAlert(rule, violation);
        }
      });
    });
  }

  private checkRule(message: StreamMessage, rule: QualityRule): any {
    const data = message.value;
    
    switch (rule.type) {
      case 'completeness':
        if (rule.field && (data[rule.field] === null || data[rule.field] === undefined || data[rule.field] === '')) {
          return { field: rule.field, value: data[rule.field] };
        }
        break;
        
      case 'validity':
        if (rule.field && rule.condition.pattern) {
          const pattern = new RegExp(rule.condition.pattern);
          if (!pattern.test(String(data[rule.field] || ''))) {
            return { field: rule.field, value: data[rule.field] };
          }
        }
        break;
        
      case 'accuracy':
        if (rule.field && rule.condition.range) {
          const value = Number(data[rule.field]);
          if (isNaN(value) || value < rule.condition.range.min || value > rule.condition.range.max) {
            return { field: rule.field, value: data[rule.field] };
          }
        }
        break;
    }
    
    return null;
  }

  private createAlert(rule: QualityRule, violation: any): void {
    const alertId = `${rule.id}-${Date.now()}`;
    
    const alert: DataQualityAlert = {
      id: alertId,
      severity: rule.severity === 'critical' ? 'critical' : 'warning',
      metric: rule.name,
      message: `${rule.description}: ${violation.field} = ${violation.value}`,
      value: violation.value,
      threshold: 0, // Rule-based alerts don't have numeric thresholds
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);
  }

  private checkAlerts(): void {
    this.metrics.forEach(metric => {
      // Check for warning threshold
      if (metric.value < metric.threshold.warning && metric.value >= metric.threshold.critical) {
        this.createThresholdAlert(metric, 'warning');
      }
      
      // Check for critical threshold
      if (metric.value < metric.threshold.critical) {
        this.createThresholdAlert(metric, 'critical');
      }
    });
  }

  private createThresholdAlert(metric: DataQualityMetric, severity: 'warning' | 'critical'): void {
    const alertId = `${metric.name}-${severity}-${Date.now()}`;
    
    // Check if similar alert already exists and is not resolved
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.metric === metric.name && 
      alert.severity === severity && 
      !alert.resolvedAt
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const threshold = severity === 'critical' ? metric.threshold.critical : metric.threshold.warning;
    
    const alert: DataQualityAlert = {
      id: alertId,
      severity,
      metric: metric.name,
      message: `${metric.name} quality metric (${metric.value.toFixed(2)}%) is below ${severity} threshold (${threshold}%)`,
      value: metric.value,
      threshold,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);
  }

  private isValidMessage(message: StreamMessage): boolean {
    // Basic validation - message should have value and be parseable
    try {
      if (!message.value) {
        return false;
      }
      
      if (typeof message.value === 'string') {
        JSON.parse(message.value);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private calculateOverallScore(metrics: DataQualityMetric[]): number {
    if (metrics.length === 0) {
      return 100;
    }

    const totalScore = metrics.reduce((sum, metric) => sum + metric.value, 0);
    return totalScore / metrics.length;
  }

  private calculateTrends(): any {
    const metrics = this.getMetrics();
    
    return {
      completeness: metrics.find(m => m.name === 'completeness')?.value || 100,
      accuracy: metrics.find(m => m.name === 'accuracy')?.value || 100,
      consistency: metrics.find(m => m.name === 'consistency')?.value || 100,
      timeliness: metrics.find(m => m.name === 'timeliness')?.value || 100,
      validity: metrics.find(m => m.name === 'validity')?.value || 100,
    };
  }

  private generateRecommendations(metrics: DataQualityMetric[], alerts: DataQualityAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Check for low completeness
    const completeness = metrics.find(m => m.name === 'completeness');
    if (completeness && completeness.value < 90) {
      recommendations.push('Improve data completeness by implementing required field validation');
    }

    // Check for low accuracy
    const accuracy = metrics.find(m => m.name === 'accuracy');
    if (accuracy && accuracy.value < 95) {
      recommendations.push('Review data processing rules to improve accuracy');
    }

    // Check for consistency issues
    const consistency = metrics.find(m => m.name === 'consistency');
    if (consistency && consistency.value < 95) {
      recommendations.push('Standardize data types and formats across all data sources');
    }

    // Check for timeliness issues
    const timeliness = metrics.find(m => m.name === 'timeliness');
    if (timeliness && timeliness.value < 90) {
      recommendations.push('Optimize data pipeline to reduce processing latency');
    }

    // Check for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolvedAt);
    if (criticalAlerts.length > 0) {
      recommendations.push(`Address ${criticalAlerts.length} critical data quality issues immediately`);
    }

    return recommendations;
  }

  private initializeDefaultRules(): void {
    // Add some default quality rules
    this.addQualityRule({
      id: 'required-customer-id',
      name: 'Customer ID Required',
      type: 'completeness',
      field: 'customerId',
      condition: {},
      severity: 'critical',
      description: 'Customer ID must be present',
    });

    this.addQualityRule({
      id: 'valid-email-format',
      name: 'Valid Email Format',
      type: 'validity',
      field: 'email',
      condition: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      severity: 'warning',
      description: 'Email must be in valid format',
    });

    this.addQualityRule({
      id: 'positive-amount',
      name: 'Positive Amount',
      type: 'accuracy',
      field: 'amount',
      condition: { range: { min: 0, max: 1000000 } },
      severity: 'warning',
      description: 'Amount must be positive and reasonable',
    });
  }
}