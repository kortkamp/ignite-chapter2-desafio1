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
        api.get(`/products/${productId}`).then(response =>{
          const product :Product = {...response.data, amount:1};
          const newCart = [...cart, product];
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
          setCart(newCart);
        })
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(product =>
        product.id !== productId
      )
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
      setCart(newCart);
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
      api.get(`/stock/${productId}`).then(response => {
        const stock:Stock = response.data;

        if(stock.amount >= amount){
          const newCart = cart.map(product => {
            return product.id===productId ? 
              {...product , [product.amount]:amount}:
              product
          });
          localStorage.setItem('@RocketShoes:cart',JSON.stringify(newCart));
          setCart(newCart);
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      })

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
