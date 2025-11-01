import { useState, useCallback } from 'react';
import { materialService, Material, CreateMaterialData, UpdateMaterialData } from '../context/MaterialsContext';

export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await materialService.list();
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMaterial = useCallback(async (materialData: CreateMaterialData) => {
    setLoading(true);
    setError(null);
    try {
      const newMaterial = await materialService.create(materialData);
      setMaterials(prev => [...prev, newMaterial]);
      return newMaterial;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMaterial = useCallback(async (id: string, materialData: UpdateMaterialData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMaterial = await materialService.update(id, materialData);
      setMaterials(prev => prev.map(m => m.id === id ? updatedMaterial : m));
      return updatedMaterial;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await materialService.delete(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMaterialById = useCallback(async (id: string): Promise<Material> => {
    setLoading(true);
    setError(null);
    try {
      const material = await materialService.getById(id);
      return material;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await materialService.getStats();
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const materialsByCategory = await materialService.getByCategory(category);
      return materialsByCategory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar materiais por categoria');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByName = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const searchResults = await materialService.searchByName(searchTerm);
      return searchResults;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar materiais');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    materials,
    loading,
    error,
    loadMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialById,
    getStats,
    getByCategory,
    searchByName
  };
};