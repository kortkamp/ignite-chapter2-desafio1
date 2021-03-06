import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productFound = cart.find(product => product.id === productId);
      if(productFound){
        updateProductAmount({productId, amount:productFound.amount + 1});
      }else {
        const stock = await api.get(`/stock/${productId}`);
        const stockAmount = stock.data.amount;

        if(stockAmount >= 1){
          const productData = await api.get(`/products/${productId}`);
          const product :Product = {...productData.data, amount:1};
          const newCart = [...cart, product];
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
          setCart(newCart);
        }else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productIndex = newCart.findIndex(product => product.id === productId);
      if(productIndex >= 0){
        newCart.splice(productIndex,1);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
        setCart(newCart);
      }else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(stockAmount >= amount){
        const newCart = cart.map(product => {
          return product.id===productId ? 
            {...product , 'amount':amount}:
            product
        });
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
        setCart(newCart);
      }else{
        toast.error('Quantidade solicitada fora de estoque');
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
