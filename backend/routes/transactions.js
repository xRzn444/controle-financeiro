import express from 'express';
import pool from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Listar transações do usuário
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Criar transação
router.post('/', auth, async (req, res) => {
  const { type, name, value, category, date, notes } = req.body;
  if (!type || !name || !value || !category || !date) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, name, value, category, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [req.user.id, type, name, value, category, date, notes || '']
    );
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Editar transação
router.put('/:id', auth, async (req, res) => {
  const { type, name, value, category, date, notes } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE transactions SET type=?, name=?, value=?, category=?, date=?, notes=?, updated_at=NOW() WHERE id=? AND user_id=?',
      [type, name, value, category, date, notes || '', req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar transação' });
  }
});

// Excluir transação
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM transactions WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

export default router; 