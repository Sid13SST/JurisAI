import { Router } from 'express';
import { uploadAndParseContract, downloadContract, deleteContractLocal } from '../controllers/contractController';

const router = Router();

router.post('/upload-and-parse', uploadAndParseContract);
router.get('/download/:userId/:contractId', downloadContract);
router.delete('/:userId/:contractId', deleteContractLocal);

export default router;
