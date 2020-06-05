import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import logo from '../../assets/logo.svg';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';
import './styles.css';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUfResponse{
    sigla: string;
}

interface IBGECityResponse{
    nome: string;
}


const Createpoint = () => {
    const history = useHistory();
    const [itens, setItens] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [citys, setCitys] = useState<string[]>([]);
    const [selectedItens, setSelectedItens] = useState<number[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
    });
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            setInitialPosition([
                latitude,
                longitude,
            ])
        })
    }, [])

    useEffect(() => {
        api.get('/itens').then(response => {
            setItens(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const initials = response.data.map(uf => uf.sigla);
            setUfs(initials);
        })
    }, []);

    useEffect(() => {
        if (selectedUf === '0'){
            return;
        }
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const city = response.data.map(city => city.nome);
            setCitys(city);
        })
    }, [selectedUf]);

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;
        setFormData({
            ...formData, [name]: value
        });
    }

    function handleSelectItem(id: number){
        const alreadySelected = selectedItens.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredIten = selectedItens.filter(item => item !== id);
            setSelectedItens(filteredIten);
        } else {
            setSelectedItens([...selectedItens, id]);
        }
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();
        
        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude ] = selectedPosition;
        const itens = selectedItens;
        
        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            itens
        }

        await api.post('/points', data);

        alert('Ponto de coleta criado!!');

        history.push('/');
    }   
    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br />ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                            <label htmlFor="name">
                                Nome da entidade
                            </label>
                            <input 
                                type="text"
                                name="name"
                                id="name"
                                onChange={handleInputChange}
                            />
                    </div>


                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">
                                E-mail
                            </label>
                            <input 
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">
                               Whatsapp
                            </label>
                            <input 
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>   
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o enderço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15}  onCLick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}/>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select onChange={handleSelectUf} value={selectedUf} name="uf" id="uf">
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {citys.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {itens.map(item => (
                            <li 
                                className={selectedItens.includes(item.id) ? 'selected' : ''} 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}   
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default Createpoint;