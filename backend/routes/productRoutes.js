const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const multer = require('multer');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticate, authorize(['admin']), productController.createProduct);
router.put('/:id', authenticate, authorize(['admin']), productController.updateProduct);
router.delete('/:id', authenticate, authorize(['admin']), productController.deleteProduct);
router.post('/:id/images', authenticate, authorize(['admin']), upload.array('images', 10), productController.uploadProductImages
);
router.delete('/:productId/images/:imageId', authenticate, authorize(['admin']), productController.deleteProductImage
);

module.exports = router;