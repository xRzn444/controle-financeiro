import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Cadastro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  try {
    const [userExists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, hash]
    );
    const userId = result.insertId;
    res.status(201).json({ id: userId, name, email });
  } catch (err) {
    res.status(500).json({ error: 'Erro no cadastro' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

export default router; 