import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { InputField } from '../components/Input';

const BREAKER_TYPES = [
  { value: 'geral', label: 'Geral', icon: 'shield-checkmark' as const, color: '#EF4444' },
  { value: 'tomadas', label: 'Tomadas', icon: 'power' as const, color: '#3B82F6' },
  { value: 'iluminacao', label: 'Iluminação', icon: 'bulb' as const, color: '#F59E0B' },
  { value: 'chuveiro', label: 'Chuveiro', icon: 'water' as const, color: '#06B6D4' },
  { value: 'arcondicionado', label: 'Ar Condicionado', icon: 'snow' as const, color: '#8B5CF6' },
  { value: 'forno', label: 'Forno/Fogão', icon: 'flame' as const, color: '#F97316' },
  { value: 'bomba', label: 'Bomba d\'Água', icon: 'speedometer' as const, color: '#10B981' },
  { value: 'outros', label: 'Outros', icon: 'apps' as const, color: '#6B7280' }
];

const STANDARD_AMPERAGES = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];

interface Breaker {
  id: string;
  circuitNumber: number;
  type: string;
  description: string;
  amperage: number;
  quantity: number;
  location: string;
  obs?: string;
}

interface FormData {
  circuitNumber: string;
  type: string;
  description: string;
  amperage: string;
  quantity: string;
  location: string;
  obs: string;
}

interface ProjectInfo {
  projectName: string;
  clientName: string;
  address: string;
  responsibleTechnician: string;
  crea: string;
  date: string;
}

export function CircuitBreakerManager() {
  const [breakers, setBreakers] = useState<Breaker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBreaker, setEditingBreaker] = useState<Breaker | null>(null);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    circuitNumber: '',
    type: 'geral',
    description: '',
    amperage: '',
    quantity: '1',
    location: '',
    obs: ''
  });
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    projectName: '',
    clientName: '',
    address: '',
    responsibleTechnician: '',
    crea: '',
    date: new Date().toLocaleDateString('pt-BR')
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const getNextCircuitNumber = (): number => {
    if (breakers.length === 0) return 1;
    
    const usedNumbers = breakers.map(b => b.circuitNumber).sort((a, b) => a - b);
    
    for (let i = 1; i <= usedNumbers.length + 1; i++) {
      if (!usedNumbers.includes(i)) {
        return i;
      }
    }
    
    return usedNumbers.length + 1;
  };

  const isCircuitNumberUsed = (number: number, excludeId?: string): boolean => {
    return breakers.some(b => b.circuitNumber === number && b.id !== excludeId);
  };

  const generateHTMLTable = (): string => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR');
    const contactInfo = {
      phone: "(11) 98602-4724",
      website: "ricardoeletricista.com.br",
    };

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Identificação de QDC</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #2c3e50;
          background-color: #f8f9fa;
          padding: 15px;
        }
        
        .document-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
          color: white;
          padding: 25px 20px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.1;
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 1px;
        }
        
        .header h2 {
          font-size: 16px;
          font-weight: 400;
          opacity: 0.95;
          letter-spacing: 0.5px;
        }
        
        .contact-info {
          background: #34495e;
          color: white;
          padding: 12px 20px;
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 11px;
          flex-wrap: wrap;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .contact-icon {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }
        
        .content-wrapper {
          padding: 25px;
        }
        
        .project-info {
          background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
          border-left: 5px solid #e67e22;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .project-info h3 {
          color: #2c3e50;
          font-size: 16px;
          margin-bottom: 15px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
        }
        
        .label {
          font-weight: 600;
          color: #34495e;
          min-width: 140px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        
        .value {
          color: #2c3e50;
          font-weight: 500;
        }
        
        .table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
          color: white;
        }
        
        th {
          padding: 15px 12px;
          font-weight: 600;
          text-align: center;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid rgba(255,255,255,0.2);
        }
        
        th:last-child {
          border-right: none;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #ecf0f1;
          border-right: 1px solid #ecf0f1;
          text-align: center;
          vertical-align: middle;
        }
        
        td:last-child {
          border-right: none;
        }
        
        tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        tbody tr:nth-child(even) {
          background-color: #fbfcfd;
        }
        
        .description {
          text-align: left !important;
          font-weight: 500;
          line-height: 1.4;
        }
        
        .obs-text {
          font-style: italic;
          color: #7f8c8d;
          font-size: 10px;
          margin-top: 4px;
          padding-left: 12px;
          border-left: 2px solid #e67e22;
        }
        
        .circuit-number {
          font-weight: 700;
          font-size: 16px;
          color: #e67e22;
          background: #fef9e7;
          border-radius: 4px;
          padding: 4px 8px;
          display: inline-block;
          min-width: 35px;
        }
        
        .amperage {
          font-weight: 700;
          color: #27ae60;
          font-size: 13px;
        }
        
        .voltage {
          font-weight: 600;
          color: #8e44ad;
          font-size: 12px;
        }
        
        .footer {
          background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
          border-left: 5px solid #e67e22;
          padding: 20px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 20px;
        }
        
        .footer-title {
          font-weight: 700;
          font-size: 14px;
          color: #2c3e50;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .footer-notes {
          background: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 3px solid #f39c12;
          font-size: 11px;
          line-height: 1.6;
        }
        
        .footer-notes ul {
          list-style: none;
          padding-left: 0;
        }
        
        .footer-notes li {
          padding: 4px 0;
          position: relative;
          padding-left: 20px;
        }
        
        .footer-notes li::before {
          content: '⚠️';
          position: absolute;
          left: 0;
          top: 4px;
        }
        
        .footer-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          padding-top: 15px;
          border-top: 2px solid #d5dbdb;
        }
        
        .stat-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-label {
          font-size: 10px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .signature-section {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding: 0 20px;
        }
        
        .signature-box {
          text-align: center;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 2px dashed #bdc3c7;
        }
        
        .signature-line {
          border-bottom: 2px solid #34495e;
          height: 50px;
          margin-bottom: 12px;
        }
        
        .signature-label {
          font-weight: 700;
          color: #2c3e50;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .signature-sublabel {
          font-size: 10px;
          color: #7f8c8d;
          margin-top: 4px;
        }
        
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-stats {
            grid-template-columns: 1fr;
          }
          
          .signature-section {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          th, td {
            padding: 8px 6px;
            font-size: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">
          <div class="header-content">
            <h1>IDENTIFICAÇÃO DE QDC</h1>
            <h2>QUADRO DE DISTRIBUIÇÃO DE CIRCUITOS</h2>
          </div>
        </div>
        
        <div class="contact-info">
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <span>${contactInfo.phone}</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${contactInfo.website}</span>
          </div>
          
        </div>
        
        <div class="content-wrapper">`;

    if (projectInfo.projectName || projectInfo.clientName) {
      html += `
      <div class="project-info">
        <h3>Informações do Projeto</h3>
        <div class="info-grid">`;
      
      if (projectInfo.projectName) {
        html += `<div class="info-item"><span class="label">Projeto:</span> <span class="value">${projectInfo.projectName}</span></div>`;
      }
      if (projectInfo.clientName) {
        html += `<div class="info-item"><span class="label">Cliente:</span> <span class="value">${projectInfo.clientName}</span></div>`;
      }
      if (projectInfo.address) {
        html += `<div class="info-item"><span class="label">Endereço:</span> <span class="value">${projectInfo.address}</span></div>`;
      }
      if (projectInfo.responsibleTechnician) {
        html += `<div class="info-item"><span class="label">Responsável:</span> <span class="value">${projectInfo.responsibleTechnician}</span></div>`;
      }
      if (projectInfo.crea) {
        html += `<div class="info-item"><span class="label">CREA:</span> <span class="value">${projectInfo.crea}</span></div>`;
      }
      html += `<div class="info-item"><span class="label">Data:</span> <span class="value">${projectInfo.date}</span></div>`;
      html += `
        </div>
      </div>`;
    }

    const sortedBreakers = [...breakers].sort((a, b) => a.circuitNumber - b.circuitNumber);
    
    html += `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th width="10%">Circuito</th>
            <th width="12%">Bitola Cabo</th>
            <th width="38%">Descrição</th>
            <th width="12%">Corrente</th>
            <th width="16%">Tensão</th>
          </tr>
        </thead>
        <tbody>`;

    sortedBreakers.forEach((breaker) => {
      const bitola = breaker.amperage <= 16 ? '2,5mm²' : 
                   breaker.amperage <= 25 ? '4mm²' : 
                   breaker.amperage <= 32 ? '6mm²' : 
                   breaker.amperage <= 50 ? '10mm²' : '16mm²';
      
      html += `
      <tr>
        <td><span class="circuit-number">${String(breaker.circuitNumber).padStart(2, '0')}</span></td>
        <td><strong>${bitola}</strong></td>
        <td class="description">
          ${breaker.description}
          ${breaker.obs ? `<div class="obs-text">${breaker.obs}</div>` : ''}
        </td>
        
        <td><span class="amperage">${breaker.amperage}A</span></td>
        <td><strong>${breaker.location}</strong></td>
      </tr>`;
    });

    html += `
        </tbody>
      </table>
    </div>`;

    const totalCircuits = breakers.length;
    const totalCurrent = breakers.reduce((total, b) => total + (b.amperage * b.quantity), 0);

    html += `
    <div class="footer">
      <div class="footer-title">Observações Importantes</div>
      <div class="footer-notes">
        <ul>
          <li>Sempre desligue a energia antes de qualquer manutenção ou reparo</li>
          <li>Mantenha esta identificação sempre atualizada e em local visível</li>
          <li>Em caso de dúvidas, consulte um eletricista qualificado</li>
          <li>Não execute trabalhos elétricos sem conhecimento técnico adequado</li>
          <li>Verifique periodicamente o funcionamento dos disjuntores</li>
        </ul>
      </div>
      
      <div class="footer-stats">
        <div class="stat-item">
          <div class="stat-label">Total de Circuitos</div>
          <div class="stat-value">${totalCircuits}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Carga Total</div>
          <div class="stat-value">${totalCurrent}A</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Gerado em</div>
          <div class="stat-value">${formattedDate}</div>
        </div>
      </div>
    </div>

      </div>
    </body>
    </html>`;

    return html;
  };

  const generatePDF = async () => {
    if (breakers.length === 0) {
      Alert.alert('Aviso', 'Adicione pelo menos um disjuntor para gerar o PDF.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const htmlContent = generateHTMLTable();
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      const fileName = `QDC_${projectInfo.clientName || 'Cliente'}_${Date.now()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        Alert.alert(
          'PDF Gerado com Sucesso!',
          'O que deseja fazer com o arquivo?',
          [
            {
              text: 'Compartilhar',
              onPress: () => Sharing.shareAsync(newPath)
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'PDF Gerado!',
          `O arquivo foi salvo com sucesso.\n\nLocal: ${newPath}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      Alert.alert(
        'Erro', 
        `Não foi possível gerar o PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (showForm || showProjectInfo) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
    }
  }, [showForm, showProjectInfo]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const updateProjectField = useCallback((field: keyof ProjectInfo, value: string) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.circuitNumber || parseInt(formData.circuitNumber) <= 0) {
      newErrors.circuitNumber = 'Número do circuito deve ser maior que 0';
    } else {
      const circuitNumber = parseInt(formData.circuitNumber);
      if (isCircuitNumberUsed(circuitNumber, editingBreaker?.id)) {
        newErrors.circuitNumber = 'Este número de circuito já está sendo usado';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.amperage || parseFloat(formData.amperage) <= 0) {
      newErrors.amperage = 'Amperagem deve ser maior que 0';
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que 0';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Local é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const breakerData: Breaker = {
      id: editingBreaker?.id || Date.now().toString(),
      circuitNumber: parseInt(formData.circuitNumber),
      type: formData.type,
      description: formData.description.trim(),
      amperage: parseFloat(formData.amperage),
      quantity: parseInt(formData.quantity),
      location: formData.location.trim(),
      obs: formData.obs.trim()
    };

    if (editingBreaker) {
      setBreakers(prev => prev.map(b => b.id === editingBreaker.id ? breakerData : b));
    } else {
      setBreakers(prev => [...prev, breakerData]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (breaker: Breaker) => {
    setEditingBreaker(breaker);
    setFormData({
      circuitNumber: breaker.circuitNumber.toString(),
      type: breaker.type,
      description: breaker.description,
      amperage: breaker.amperage.toString(),
      quantity: breaker.quantity.toString(),
      location: breaker.location,
      obs: breaker.obs || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este disjuntor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => setBreakers(prev => prev.filter(b => b.id !== id))
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      circuitNumber: '',
      type: 'geral',
      description: '',
      amperage: '',
      quantity: '1',
      location: '',
      obs: ''
    });
    setEditingBreaker(null);
    setErrors({});
  };

  const suggestNextCircuitNumber = () => {
    const nextNumber = getNextCircuitNumber();
    updateField('circuitNumber', nextNumber.toString());
  };

  const getBreakerTypeInfo = (type: string) => {
    return BREAKER_TYPES.find(t => t.value === type) || BREAKER_TYPES[0];
  };

  const sortedBreakers = [...breakers].sort((a, b) => a.circuitNumber - b.circuitNumber);

  
  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
        
        <View className="px-6 mt-16 pb-6">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity className="w-10 h-10 bg-gray-800/60 rounded-xl items-center justify-center border border-gray-700/40">
              <Ionicons name="chevron-back" size={18} color="#60A5FA" />
            </TouchableOpacity>
            
            <View className="flex-1 items-center">
              <Text className="text-white font-bold text-sm">QUADRO DE DISTRIBUIÇÃO</Text>
              <View className="w-16 h-0.5 bg-amber-500 rounded-full mt-1" />
            </View>

            <TouchableOpacity 
              onPress={generatePDF}
              disabled={isGeneratingPDF}
              className={`w-10 h-10 rounded-xl items-center justify-center border ${
                isGeneratingPDF 
                  ? 'bg-gray-500/20 border-gray-500/30' 
                  : 'bg-red-500/20 border-red-500/30'
              }`}
            >
              <Ionicons 
                name={isGeneratingPDF ? "hourglass" : "document"} 
                size={18} 
                color={isGeneratingPDF ? "#6B7280" : "#EF4444"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity 
              onPress={() => setShowForm(true)}
              className="flex-1"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                className="rounded-2xl p-4 border border-blue-500/30"
                  style={{
                  borderRadius: 10,
                }}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text className="text-white font-inter-black text-xs">ADICIONAR</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={generatePDF}
              disabled={isGeneratingPDF}
              className="flex-1 rounded-xl"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isGeneratingPDF ? ['#6B7280', '#4B5563'] : ['#DC2626', '#B91C1C']}
                className="rounded-2xl p-4 border border-red-500/30"
                style={{
                  borderRadius: 10,
                }}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Ionicons 
                    name={isGeneratingPDF ? "hourglass" : "document"} 
                    size={20} 
                    color="white" 
                  />
                  <Text className="text-white font-inter-black text-xs">
                    {isGeneratingPDF ? 'GERANDO...' : 'GERAR PDF'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {sortedBreakers.length > 0 ? (
            <View className="space-y-4 mb-5">
              {sortedBreakers.map((breaker, index) => {
                const typeInfo = getBreakerTypeInfo(breaker.type);
                const bitola = breaker.amperage <= 16 ? '2,5mm²' : 
                             breaker.amperage <= 25 ? '4mm²' : 
                             breaker.amperage <= 32 ? '6mm²' : 
                             breaker.amperage <= 50 ? '10mm²' : '16mm²';
                
                return (
                  <View 
                    key={breaker.id}
                    className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30 mt-5"
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 bg-amber-500/20 rounded-lg items-center justify-center">
                          <Text className="text-amber-400 font-bold text-sm">
                            {String(breaker.circuitNumber).padStart(2, '0')}
                          </Text>
                        </View>
                        <View 
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: `${typeInfo.color}20` }}
                        >
                          <Ionicons name={typeInfo.icon as keyof typeof Ionicons.glyphMap} size={18} color={typeInfo.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-bold text-base">{breaker.description}</Text>
                          <Text className="text-slate-400 font-medium text-sm">{typeInfo.label} • Circuito {breaker.circuitNumber}</Text>
                        </View>
                      </View>
                      
                      <View className="flex flex-row  -ml-24 gap-3">
                        <TouchableOpacity 
                          onPress={() => handleEdit(breaker)}
                          className="w-9 h-9 bg-blue-500/20 rounded-lg items-center justify-center"
                        >
                          <Ionicons name="create" size={15} color="#3B82F6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDelete(breaker.id)}
                          className="w-9 h-9 bg-red-500/20 rounded-lg items-center justify-center"
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1 bg-slate-700/30 rounded-xl p-3">
                        <Text className="text-slate-400 text-xs mb-1 text-center">Bitola</Text>
                        <Text className="text-white font-bold text-sm text-center">{bitola}</Text>
                      </View>
                      <View className="flex-1 bg-slate-700/30 rounded-xl p-3">
                        <Text className="text-slate-400 text-xs mb-1 text-center">Corrente</Text>
                        <Text className="text-white font-bold text-sm text-center">{breaker.amperage}A</Text>
                      </View>
                      <View className="flex-1 bg-slate-700/30 rounded-xl p-3">
                        <Text className="text-slate-400 text-xs mb-1 text-center">Tensão</Text>
                        <Text className="text-white font-bold text-sm text-center">
                          {breaker.location}
                        </Text>
                      </View>
                    </View>

                    <View className="pt-3 border-t border-slate-700/30">
                      {breaker.obs && (
                        <View className="flex-row items-center gap-2 mt-2">
                          <Ionicons name="information-circle" size={14} color="#64748B" />
                          <Text className="text-slate-400 font-medium text-xs">{breaker.obs}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center justify-center py-16">
              <View className="w-24 h-24 bg-slate-800/40 rounded-2xl items-center justify-center mb-6">
                <Ionicons name="list" size={32} color="#64748B" />
              </View>
              <Text className="text-slate-400 font-semibold text-lg mb-2">Nenhum disjuntor cadastrado</Text>
              <Text className="text-slate-500 text-sm text-center">
                Adicione disjuntores para gerar sua tabela de identificação
              </Text>
            </View>
          )}

        </ScrollView>

        <Modal
          visible={showForm}
          animationType="none"
          transparent={true}
          onRequestClose={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <Animated.View 
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-neutral-900 rounded-t-3xl border-t border-gray-700/30"
            >
              <View className="px-6 pt-6 pb-4">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white font-bold text-xl">
                    {editingBreaker ? 'Editar Disjuntor' : 'Novo Disjuntor'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="w-8 h-8 bg-gray-800/60 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                  
                  <View className="mb-6">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-amber-500/15">
                        <Ionicons name="keypad" size={16} color="#F59E0B" />
                      </View>
                      <Text className="text-white font-semibold text-base">Número do Circuito</Text>
                      <TouchableOpacity 
                        onPress={suggestNextCircuitNumber}
                        className="ml-auto bg-amber-500/20 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-amber-400 font-medium text-sm">Próximo: {getNextCircuitNumber()}</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row gap-3 items-start">
                      <View className="flex-1">
                        <InputField
                          label=""
                          value={formData.circuitNumber}
                          onChangeText={(text) => updateField('circuitNumber', text)}
                          placeholder="Ex: 1, 2, 3..."
                          icon="keypad"
                          keyboardType="numeric"
                          error={errors.circuitNumber}
                        />
                      </View>
                      <TouchableOpacity 
                        onPress={suggestNextCircuitNumber}
                        className="w-12 h-12 bg-amber-500/20 rounded-xl items-center justify-center border border-amber-500/30 mt-1"
                      >
                        <Ionicons name="refresh" size={20} color="#F59E0B" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-purple-500/15">
                        <Ionicons name="options" size={16} color="#8B5CF6" />
                      </View>
                      <Text className="text-white font-semibold text-base">Tipo de Disjuntor</Text>
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-3 pr-4">
                        {BREAKER_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type.value}
                            onPress={() => updateField('type', type.value)}
                            className={`px-4 py-3 rounded-xl border min-w-[100px] ${
                              formData.type === type.value
                                ? 'border-purple-500/50 bg-purple-500/20'
                                : 'border-gray-600/40 bg-gray-800/30'
                            }`}
                          >
                            <View className="items-center gap-2">
                              <View 
                                className="w-8 h-8 rounded-lg items-center justify-center"
                                style={{ backgroundColor: `${type.color}20` }}
                              >
                                <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={16} color={type.color} />
                              </View>
                              <Text className={`font-semibold text-xs text-center ${
                                formData.type === type.value ? 'text-purple-200' : 'text-gray-300'
                              }`}>
                                {type.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <InputField
                    label="Descrição"
                    value={formData.description}
                    onChangeText={(text) => updateField('description', text)}
                    placeholder="Ex: Tomadas da Sala de Estar"
                    icon="document-text"
                    error={errors.description}
                  />

                  <View className="flex-row gap-3 mb-5">
                    <View className="flex-1">
                      <InputField
                        label="Amperagem"
                        value={formData.amperage}
                        onChangeText={(text) => updateField('amperage', text)}
                        placeholder="20"
                        icon="flash"
                        keyboardType='numeric'
                        error={errors.amperage}
                      />
                    </View>
                    <View className="flex-1">
                      <InputField
                        label="Quantidade"
                        value={formData.quantity}
                        onChangeText={(text) => updateField('quantity', text)}
                        placeholder="1"
                        icon="copy"
                        keyboardType="numeric"
                        error={errors.quantity}
                      />
                    </View>
                  </View>

                  <View className="mb-5">
                    <Text className="text-slate-400 font-medium text-sm mb-3">Amperagens Comuns:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2 pr-4">
                        {STANDARD_AMPERAGES.map((amp) => (
                          <TouchableOpacity
                            key={amp}
                            onPress={() => updateField('amperage', amp.toString())}
                            className={`px-3 py-2 rounded-lg border ${
                              formData.amperage === amp.toString()
                                ? 'border-blue-500/50 bg-blue-500/20'
                                : 'border-gray-600/40 bg-gray-800/30'
                            }`}
                          >
                            <Text className={`font-semibold text-sm ${
                              formData.amperage === amp.toString() ? 'text-blue-200' : 'text-gray-300'
                            }`}>
                              {amp}A
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <InputField
                    label="Tensão"
                    value={formData.location}
                    onChangeText={(text) => updateField('location', text)}
                    placeholder="Ex: 110V, 127V, 220V, 380V..."
                    icon="location"
                    error={errors.location}
                  />

                  <View className="mb-5">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-gray-600/20">
                        <Ionicons name="chatbox" size={16} color="#9CA3AF" />
                      </View>
                      <Text className="text-white font-semibold text-base">Observações</Text>
                    </View>
                    
                    <TextInput
                      value={formData.obs}
                      onChangeText={(text) => updateField('obs', text)}
                      placeholder="Observações adicionais (opcional)"
                      placeholderTextColor="#6B7280"
                      multiline
                      autoCorrect={false}
                      textAlignVertical="top"
                      className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                      style={{ minHeight: 80 }}
                    />
                  </View>

                </ScrollView>

                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity 
                    onPress={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="flex-1 bg-gray-800/60 rounded-xl py-4 border border-gray-700/40"
                  >
                    <Text className="text-gray-300 font-semibold text-center">Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleSave}
                    className="flex-1 bg-blue-600 rounded-xl py-4"
                    style={{
                      shadowColor: "#3B82F6",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text className="text-white font-bold text-center">
                      {editingBreaker ? 'Salvar Alterações' : 'Adicionar Disjuntor'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <Modal
          visible={showProjectInfo}
          animationType="none"
          transparent={true}
          onRequestClose={() => setShowProjectInfo(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <Animated.View 
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-neutral-900 rounded-t-3xl border-t border-gray-700/30"
            >
              <View className="px-6 pt-6 pb-4">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white font-bold text-xl">Dados do Projeto</Text>
                  <TouchableOpacity 
                    onPress={() => setShowProjectInfo(false)}
                    className="w-8 h-8 bg-gray-800/60 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                  
                  <View className="mb-5">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-green-500/15">
                        <Ionicons name="folder" size={16} color="#10B981" />
                      </View>
                      <Text className="text-white font-semibold text-base">Nome do Projeto</Text>
                    </View>
                    <TextInput
                      value={projectInfo.projectName}
                      onChangeText={(text) => updateProjectField('projectName', text)}
                      placeholder="Ex: Instalação Elétrica Residencial"
                      placeholderTextColor="#6B7280"
                      autoCorrect={false}
                      className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                    />
                  </View>

                  <View className="mb-5">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-blue-500/15">
                        <Ionicons name="person" size={16} color="#3B82F6" />
                      </View>
                      <Text className="text-white font-semibold text-base">Nome do Cliente</Text>
                    </View>
                    <TextInput
                      value={projectInfo.clientName}
                      onChangeText={(text) => updateProjectField('clientName', text)}
                      placeholder="Ex: João Silva"
                      placeholderTextColor="#6B7280"
                      autoCorrect={false}
                      className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                    />
                  </View>

                  <View className="mb-5">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-purple-500/15">
                        <Ionicons name="location" size={16} color="#8B5CF6" />
                      </View>
                      <Text className="text-white font-semibold text-base">Endereço</Text>
                    </View>
                    <TextInput
                      value={projectInfo.address}
                      onChangeText={(text) => updateProjectField('address', text)}
                      placeholder="Rua, número, bairro, cidade"
                      placeholderTextColor="#6B7280"
                      multiline
                      autoCorrect={false}
                      textAlignVertical="top"
                      className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                      style={{ minHeight: 80 }}
                    />
                  </View>

                  <View className="mb-5">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-7 h-7 rounded-lg items-center justify-center bg-amber-500/15">
                        <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
                      </View>
                      <Text className="text-white font-semibold text-base">Responsável Técnico</Text>
                    </View>
                    <TextInput
                      value={projectInfo.responsibleTechnician}
                      onChangeText={(text) => updateProjectField('responsibleTechnician', text)}
                      placeholder="Ex: Eng. Maria Santos"
                      placeholderTextColor="#6B7280"
                      autoCorrect={false}
                      className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 mb-5">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-7 h-7 rounded-lg items-center justify-center bg-red-500/15">
                          <Ionicons name="card" size={16} color="#EF4444" />
                        </View>
                        <Text className="text-white font-semibold text-base">CREA</Text>
                      </View>
                      <TextInput
                        value={projectInfo.crea}
                        onChangeText={(text) => updateProjectField('crea', text)}
                        placeholder="123456789-0"
                        placeholderTextColor="#6B7280"
                        autoCorrect={false}
                        className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                      />
                    </View>

                    <View className="flex-1 mb-5">
                      <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-7 h-7 rounded-lg items-center justify-center bg-cyan-500/15">
                          <Ionicons name="calendar" size={16} color="#06B6D4" />
                        </View>
                        <Text className="text-white font-semibold text-base">Data</Text>
                      </View>
                      <TextInput
                        value={projectInfo.date}
                        onChangeText={(text) => updateProjectField('date', text)}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#6B7280"
                        autoCorrect={false}
                        className="rounded-xl px-4 py-4 text-white font-medium text-base border border-gray-600/30 bg-gray-800/40"
                      />
                    </View>
                  </View>

                </ScrollView>

                <TouchableOpacity 
                  onPress={() => setShowProjectInfo(false)}
                  className="mt-6 bg-green-600 rounded-xl py-4"
                  style={{
                    shadowColor: "#059669",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text className="text-white font-bold text-center">Salvar Dados</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {breakers.length > 0 && (
          <View className="px-6 py-4 border-t border-gray-800/60 mb-3">
            <View className="flex-row justify-between items-center">
              <View className="items-center">
                <Text className="text-slate-400 text-xs font-medium">Circuitos</Text>
                <Text className="text-white font-bold text-lg">{breakers.length}</Text>
              </View>
              <View className="items-center">
                <Text className="text-slate-400 text-xs font-medium">Carga Total</Text>
                <Text className="text-amber-400 font-bold text-lg">
                  {breakers.reduce((total, b) => total + (b.amperage * b.quantity), 0)}A
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-slate-400 text-xs font-medium">Tipos</Text>
                <Text className="text-blue-400 font-bold text-lg">
                  {new Set(breakers.map(b => b.type)).size}
                </Text>
              </View>
            </View>
          </View>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}